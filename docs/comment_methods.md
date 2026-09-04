# AI Agent Instruction: Code Commenting Standards and Rules

You are an advanced AI software engineering agent. You must follow these strict rules and heuristics regarding when to write comments, when to avoid them, and how to format them. Your goal is to maximize code readability and maintainability.

## 1. Core Philosophy: Code is for "What", Comments are for "Why"
* **Self-Documenting Code First:** Write clean, expressive code. Use descriptive variable, function, and class names so that the code explains *what* it is doing.
* **Explain Intent, Not Execution:** Comments must explain the business logic, hidden constraints, or engineering decisions *behind* the code—never repeat what the syntax already states.

---

## 2. When to USE Comments (Required Scenarios)

You must write comments in the following scenarios:

* **Intent and Context ("Why"):** Explain non-obvious engineering decisions, business rules, or architectural choices.
* **Workarounds and Hacks:** Explain why an unidiomatic or unusual solution was used (e.g., fixing a framework bug, addressing a browser compatibility issue).
* **Public API & Interface Documentation:** Use language-standard docstrings (e.g., JSDoc, Python docstrings, Javadoc) to document public functions, classes, arguments, and return types.
* **External Attribution:** Link to external sources, GitHub issues, or Stack Overflow answers if code was adapted from them.
* **Task Tracking:** Use `// TODO:` or `// FIXME:` to explicitly mark incomplete logic, performance bottlenecks, or temporary placeholders.

---

## 3. When to NOT Use Comments (Strictly Forbidden)

You must completely avoid comments in these scenarios:

* **Redundant Logic Restatements:** Do not write comments that can be read directly from the syntax (e.g., `i++; // Increment i`).
* **Masking Bad Code:** Never use comments to explain confusing, deeply nested, or messy code. Refactor the code to be clean instead.
* **Dead or Commented-Out Code:** Never leave old, unused code commented out. Delete it entirely. Version control (Git) handles history tracking.
* **Cryptic Clarifications:** Do not use a short/cryptic variable name and a comment to explain it. Rename the variable to be self-explanatory.

---

## 4. Best Practices & How to Write Comments

When writing a permitted comment, adhere to these structural rules:

* **Keep it Concise:** Write short, punchy sentences. Avoid conversational filler or narratives.
* **Maintain Professional Tone:** Keep comments factual, neutral, and professional. Avoid jokes, slang, or emotional language.
* **Stay Synchronized:** If you modify a block of code, you must immediately update or delete its corresponding comment so it never becomes stale or misleading.
* **Formatting Rules:**
  * Capitalize the first letter of the comment.
  * Use proper punctuation (end with a period for full sentences).
  * Insert exactly one space between the comment delimiter (`//`, `#`) and the first letter of the text.

---

## 5. Comparative Examples

### Example 1: Redundant vs. High-Value
❌ **BAD (Redundant syntax restatement):**
```javascript
// Check if user is active and over 18
if (user.isActive && user.age >= 18) {
  // Call allow access function
  allowAccess();
}
```

**GOOD (Self-documenting code with zero comments):**
```javascript
const isAdultUser = user.isActive && user.age >= 18;

if (isAdultUser) {
  allowAccess();
}
```

### Example 2: Explaining the "Why"
❌ **BAD (Explaining *what* the timer does, missing the real reason):**
```javascript
// Wait for 300 milliseconds before calling the webhook
setTimeout(triggerWebhook, 300);
```

**GOOD (Explaining the hidden system constraint):**
```javascript
// We introduce a 300ms delay to prevent race conditions with 
// the legacy database sync, which takes ~250ms to finalize.
setTimeout(triggerWebhook, 300);
```
