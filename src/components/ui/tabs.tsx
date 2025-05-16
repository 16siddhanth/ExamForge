
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Create a context to track if TabsContent is within Tabs
const TabsContext = React.createContext(false);

// Export the context provider from the Tabs component
const TabsWithContext = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ children, ...props }, ref) => (
  <Tabs ref={ref} {...props}>
    <TabsContext.Provider value={true}>{children}</TabsContext.Provider>
  </Tabs>
));
TabsWithContext.displayName = "TabsWithContext";

// Modify TabsContent to check for proper nesting
const SafeTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
  const withinTabs = React.useContext(TabsContext);
  
  // If already within TabsContext, render directly
  if (withinTabs) {
    return <TabsContent ref={ref} className={className} {...props} />;
  }
  
  // If not within Tabs, wrap it in a Tabs component with invisible styling
  return (
    <Tabs defaultValue={props.value?.toString() || "tab"} className="hidden">
      <TabsContext.Provider value={true}>
        <TabsContent ref={ref} className={className} {...props} />
      </TabsContext.Provider>
    </Tabs>
  );
});
SafeTabsContent.displayName = "SafeTabsContent";

export { TabsWithContext as Tabs, TabsList, TabsTrigger, SafeTabsContent as TabsContent }
