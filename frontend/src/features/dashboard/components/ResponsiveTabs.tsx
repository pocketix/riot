import { useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { TbTrash } from 'react-icons/tb'
import { ResponsiveAlertDialog } from './cards/components/ResponsiveAlertDialog'
import { AddEditTabDialog } from './AddEditTabDialog'
import { Tab } from '@/schemas/dashboard/DashboardSchema'
import { AddTabFormSchemaType } from '@/schemas/dashboard/AddTabSchema'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'

interface ResponsiveTabsProps {
  tabs: Tab[]
  activeTabId: number
  editMode: boolean
  onChangeTab: (tabId: number) => void
  onDeleteTab: (tabId: number) => void
  onEditTab: (tabId: number, values: AddTabFormSchemaType) => void
  onAddTab: (values: AddTabFormSchemaType) => void
}

export function ResponsiveTabs(props: ResponsiveTabsProps) {
  useEffect(() => {
    if (!props.tabs.some((tab) => tab.id === props.activeTabId)) {
      props.onChangeTab(props.tabs[0].id)
    }
  }, [props.tabs])

  return (
    <Tabs value={String(props.activeTabId)} className="w-full shadow-sm">
      <ScrollArea className="w-full">
        <div className="w-full">
          <TabsList className="w-full justify-start px-1 py-1 sm:justify-evenly">
            {props.tabs.map((tab, index) => {
              const IconComponent = getCustomizableIcon(tab.icon!)
              return (
                <div key={tab.id} className="flex w-full items-center">
                  <TabsTrigger
                    value={String(tab.id)}
                    className="flex w-full items-center gap-1"
                    onClick={() => props.onChangeTab(tab.id)}
                  >
                    {tab.icon && IconComponent && <IconComponent className="h-4 w-4" />}
                    <span>{tab.userIdentifier}</span>

                    {props.editMode && (
                      <div className="ml-1 flex items-center">
                        {props.tabs.length > 1 && (
                          <ResponsiveAlertDialog
                            onSuccess={() => props.onDeleteTab(tab.id)}
                            content={
                              <p className="text-center font-semibold text-destructive">
                                Deleting this tab will result in losing all configured items in this tab.
                              </p>
                            }
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex h-4 items-center justify-center text-destructive"
                            >
                              <TbTrash className="h-3 w-3" />
                            </Button>
                          </ResponsiveAlertDialog>
                        )}
                        <AddEditTabDialog initialTab={tab} onEditTab={props.onEditTab} />
                      </div>
                    )}
                  </TabsTrigger>

                  {index !== props.tabs.length - 1 && <Separator orientation="vertical" className="mx-1 h-4" />}
                </div>
              )
            })}

            {props.editMode && (
              <div className="ml-2">
                <AddEditTabDialog onAddTab={props.onAddTab} />
              </div>
            )}
          </TabsList>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  )
}
