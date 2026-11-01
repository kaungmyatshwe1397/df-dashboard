1. **Type Naming Convection** When you create a new interface , use word Type in the end of name **e.g. export interface MonthlyFinancialsType** .So , i can easily know that this is type defining for what.
2. **Never commit** Untill user explicityly instuct to commit , never commit.
3. **Testing — Run Tests After Full Implementation** When implementing a plan or spec:
   1. Write all required code first.
   2. Update any documentation that the plan or spec requires.
   3. Do not run tests during implementation. Running tests mid-way introduces unnecessary wait time and noise.
   4. Once all code and doc updates are complete, stop and ask the user for permission to run tests — or wait for the user to run them directly.
   5. Only after tests are run, fix any failures that appear.
4. **Compact Controls by Default** Across the project, use shadcn `Button size="sm"` for routine page actions, filter and sort controls, and table actions. Prefer compact page-level tabs and align nearby controls visually. Use an existing larger shadcn size when a particular form, dialog, mobile touch flow, or primary decision needs it for usability. Do not create one-off sizes in a screen. Follow the component sizing and interaction patterns in `docs/lib/tokens.md`.
