/** Espacement modulaire partagé par la sidebar et les panneaux embarqués. */
export const sidebarLayout = {
  insetX: 'px-4',
  header: 'gap-3 px-4 pt-4 pb-3',
  navRail:
    'flex w-11 shrink-0 flex-col items-center self-stretch border-r border-border py-2 px-1',
  navButton:
    'relative flex size-8 shrink-0 items-center justify-center rounded-md p-0 text-muted-foreground transition-colors hover:bg-accent/45 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
  main: 'flex min-h-0 min-w-0 flex-1 flex-col',
  body: 'min-h-0 flex-1 overflow-hidden px-4 pt-3 pb-4',
  section: 'space-y-3',
  stack: 'flex min-h-0 flex-1 flex-col gap-3',
} as const
