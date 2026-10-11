1. **Type Naming Convection** When you create a new interface , use word Type in the end of name **e.g. export interface MonthlyFinancialsType** .So , i can easily know that this is type defining for what.
2. **Never commit** Untill user explicityly instuct to commit , never commit.
3. **Testing — Run Tests After Full Implementation** When implementing a plan or spec:
   1. Write all required code first.
   2. Update any documentation that the plan or spec requires.
   3. Do not run tests during implementation. Running tests mid-way introduces unnecessary wait time and noise.
   4. Once all code and doc updates are complete, stop and ask the user for permission to run tests — or wait for the user to run them directly.
   5. Only after tests are run, fix any failures that appear.