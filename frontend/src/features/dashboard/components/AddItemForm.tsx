import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@apollo/client"
import { GET_INSTANCES, GET_PARAMETERS } from "@/graphql/Queries"
import { AddItemCombobox } from "./AddItemCombobox"
import { ParameterCombobox } from "./ParameterCombobox"
import type { SdInstance, SdParameter, SdType } from "@/../../src/generated/graphql"
import { useEffect, useState } from "react"
import { VisualizationGallery } from "./visualizationExamples/VisualizationGallery"
import { VisualizationBuilder } from "./VisualizationBuilder"

const formSchema = z.object({
    device: z.string().min(1, {
        message: "A device must be selected",
    }),
    parameter: z.string().min(1, {
        message: "A parameter must be selected",
    }),
    visualization: z.string().min(1, {
        message: "A visualization must be choosen",
    }),
    details: z.string().min(1, {
        message: "Details must be filled",
    }),
})

export interface AddItemFormProps {
    setDialogOpen: (open: boolean) => void
}

export function AddItemForm({ setDialogOpen }: AddItemFormProps) {
    const { loading, error, data } = useQuery<{ sdInstances: SdInstance[] }>(GET_INSTANCES)
    const [selectedDevice, setSelectedDevice] = useState<SdInstance | null>(null)

    const [availableParameters, setAvailableParameters] = useState<SdParameter[] | null>(null)
    const [selectedParameter, setSelectedParameter] = useState<SdParameter | null>(null)

    const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState("device")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            device: "",
            parameter: "",
            visualization: "",
            details: "",
        },
    })

    const { data: parametersData } = useQuery<{ sdType: SdType }>(GET_PARAMETERS, {
        variables: {
            sdTypeId: selectedDevice?.type.id,
        },
        skip: !selectedDevice,
    })

    useEffect(() => {
        if (parametersData) {
            // console.log("Parameters", parametersData.sdType.parameters) // TODO: remove
            setAvailableParameters(parametersData.sdType.parameters)
        }
    }, [parametersData])

    const deviceValue = form.watch("device")
    const parameterValue = form.watch("parameter")
    const visualizationValue = form.watch("visualization")

    function onSubmit(values: z.infer<typeof formSchema>) {
        setDialogOpen(false)
        console.log(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="sm:space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="device">Device</TabsTrigger>
                        <TabsTrigger value="parameter" disabled={!deviceValue}>Parameter</TabsTrigger>
                        <TabsTrigger value="visualization" disabled={!parameterValue}>Visualization</TabsTrigger>
                        <TabsTrigger value="details" disabled={!visualizationValue}>Details</TabsTrigger>
                    </TabsList>
                    <TabsContent value="device">
                        <FormField
                            control={form.control}
                            name="device"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Select a device</FormLabel>
                                    <FormControl>
                                        <AddItemCombobox
                                            instances={data?.sdInstances}
                                            selectedInstance={selectedDevice}
                                            setInstance={(instance) => {
                                                setSelectedDevice(instance);
                                                console.log("Selected device", instance)
                                                form.setValue("device", instance?.type?.denotation || "");
                                                setSelectedParameter(null);
                                                form.setValue("parameter", "");
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end mt-4">
                            <Button disabled={!deviceValue} onClick={() => setActiveTab("parameter")}>
                                Next
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="parameter">
                        <FormField
                            control={form.control}
                            name="parameter"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Select a parameter</FormLabel>
                                    <FormControl>
                                        <ParameterCombobox
                                            parameters={availableParameters}
                                            selectedParameter={selectedParameter}
                                            setParameter={(parameter) => {
                                                setSelectedParameter(parameter)
                                                form.setValue("parameter", parameter?.denotation || "")
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end mt-4">
                            <Button disabled={!deviceValue || !parameterValue} onClick={() => setActiveTab("visualization")}>
                                Next
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="visualization">
                        <FormField
                            control={form.control}
                            name="visualization"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Choose a visualization</FormLabel>
                                    <FormControl>
                                        <div>
                                            <VisualizationGallery
                                                selectedVisualization={selectedVisualization}
                                                setSelectedVisualization={(visualization) => {
                                                    setSelectedVisualization(visualization);
                                                    form.setValue("visualization", visualization);
                                                    console.log("Selected visualization", visualization)
                                                }
                                                }
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end mt-4">
                            <Button disabled={!deviceValue || !parameterValue || !selectedVisualization} onClick={() => setActiveTab("details")}>
                                Next
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="details">
                        <FormField
                            control={form.control}
                            name="details"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Style the selected visualization</FormLabel>
                                    <FormControl>
                                        <VisualizationBuilder
                                            selectedVisualization={selectedVisualization}
                                            setVisualizationDetails={(data) => {
                                                form.setValue("details", data);
                                                console.log("Visualization details", data)
                                            }}
                                            selectedParameter={selectedParameter!}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>
                </Tabs>
            </form>
        </Form>
    )
}