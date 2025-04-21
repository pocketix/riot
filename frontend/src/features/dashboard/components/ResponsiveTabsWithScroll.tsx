import { useEffect, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { TbTrash } from 'react-icons/tb'
import { DeleteAlertDialog } from './cards/components/DeleteAlertDialog'
import { AddEditTabDialog } from './AddEditTabDialog'
import { Tab } from '@/schemas/dashboard/DashboardSchema'
import { AddTabFormSchemaType } from '@/schemas/dashboard/AddTabSchema'
import { getIcon } from '@/utils/getIcon'

interface ResponsiveTabsWithScrollProps {
  tabs: Tab[]
  activeTabId: number
  editMode: boolean
  onChangeTab: (tabId: number) => void
  onDeleteTab: (tabId: number) => void
  onEditTab: (tabId: number, values: AddTabFormSchemaType) => void
  onAddTab: (values: AddTabFormSchemaType) => void
}

export function ResponsiveTabsWithScroll(props: ResponsiveTabsWithScrollProps) {
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  const setTabRef = (element: HTMLButtonElement | null, tabId: number) => {
    if (element) {
      tabRefs.current.set(tabId, element)
    }
  }

  useEffect(() => {
    const currentTabIds = new Set(props.tabs.map((tab) => tab.id))

    Array.from(tabRefs.current.keys()).forEach((tabId) => {
      if (!currentTabIds.has(tabId)) {
        tabRefs.current.delete(tabId)
      }
    })
  }, [props.tabs])

  useEffect(() => {
    const activeTab = tabRefs.current.get(props.activeTabId)
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        inline: 'center'
      })
    }
  }, [props.activeTabId, props.tabs])

  useEffect(() => {
    if (!props.tabs.some((tab) => tab.id === props.activeTabId)) {
      props.onChangeTab(props.tabs[0].id)
    }
  }, [props.tabs])

  return (
    <Tabs value={String(props.activeTabId)} className="w-full">
      <ScrollArea className="w-full">
        <div className="w-full">
          <TabsList className="w-full justify-start px-1 py-1 sm:justify-evenly">
            {props.tabs.map((tab, index) => {
              const IconComponent = getIcon(tab.icon!)
              return (
                <div key={tab.id} className="flex w-full items-center">
                  <TabsTrigger
                    ref={(el) => setTabRef(el, tab.id)}
                    value={String(tab.id)}
                    className="flex w-full items-center gap-1"
                    onClick={() => props.onChangeTab(tab.id)}
                  >
                    {tab.icon && IconComponent && <IconComponent />}
                    <span>{tab.userIdentifier}</span>

                    {props.editMode && (
                      <div className="ml-1 flex items-center">
                        {props.tabs.length > 1 && (
                          <DeleteAlertDialog
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
                          </DeleteAlertDialog>
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
