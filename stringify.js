class Stringifier {
  constructor(options = {}) {
    this.indent = options.indent || 2;
    this.currentIndent = 0;
    this.seen = new WeakMap(); // Track circular references
  }

  getIndentation() {
    return " ".repeat(this.currentIndent);
  }

  stringify(value, pretty = true) {
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return "undefined";
    }

    switch (typeof value) {
      case "string":
        return this.stringifyString(value);
      case "number":
        return this.stringifyNumber(value);
      case "boolean":
        return value.toString();
      case "object": {
        // Check for circular references
        if (value instanceof Object) {
          if (this.seen.has(value)) {
            return '"[Circular Reference]"';
          }
          this.seen.set(value, true);
        }

        try {
          if (Array.isArray(value)) {
            return this.stringifyArray(value, pretty);
          }
          return this.stringifyObject(value, pretty);
        } finally {
          // Clean up the reference after processing the object
          if (value instanceof Object) {
            this.seen.delete(value);
          }
        }
      }
      default:
        return String(value);
    }
  }

  stringifyString(str) {
    // Check if string contains newlines
    if (str.includes("\n")) {
      return this.stringifyMultilineString(str);
    }

    // If string contains quotes or special characters, use JSON-style escaping
    if (/["\\\b\f\n\r\t]/.test(str) || /'/.test(str)) {
      return JSON.stringify(str);
    }

    // If string contains spaces or special characters, use single quotes
    if (/[\s,\{\}\[\]:"]/.test(str)) {
      return `'${str}'`;
    }

    // Otherwise, return as-is (quoteless)
    return str;
  }

  stringifyMultilineString(str) {
    const lines = str.split("\n");
    const baseIndent = this.getIndentation();
    const formattedLines = lines.map((line, index) => {
      if (index === 0) {
        return line;
      }
      return baseIndent + line;
    });
    return `'''${formattedLines.length > 1 ? "\n" : ""}${formattedLines.join("\n")}${formattedLines.length > 1 ? "\n" + baseIndent : ""}'''`;
  }

  stringifyNumber(num) {
    if (Number.isNaN(num)) {
      return "null";
    }
    if (!Number.isFinite(num)) {
      return "null";
    }
    return num.toString();
  }

  stringifyArray(arr, pretty) {
    if (arr.length === 0) {
      return "[]";
    }

    this.currentIndent += this.indent;
    const items = arr.map((item) => {
      const value = this.stringify(item, pretty);
      return pretty ? this.getIndentation() + value : value;
    });
    this.currentIndent -= this.indent;

    const separator = pretty ? ",\n" : ", ";
    const openBracket = pretty ? "[\n" : "[";
    const closeBracket = pretty ? `\n${this.getIndentation()}]` : "]";

    return `${openBracket}${items.join(separator)}${closeBracket}`;
  }

  stringifyObject(obj, pretty) {
    if (Object.keys(obj).length === 0) {
      return "{}";
    }

    this.currentIndent += this.indent;
    const items = Object.entries(obj).map(([key, value]) => {
      const stringifiedKey = this.stringifyString(key);
      const stringifiedValue = this.stringify(value, pretty);
      return pretty ? `${this.getIndentation()}${stringifiedKey}: ${stringifiedValue}` : `${stringifiedKey}: ${stringifiedValue}`;
    });
    this.currentIndent -= this.indent;

    const separator = pretty ? ",\n" : ", ";
    const openBrace = pretty ? "{\n" : "{";
    const closeBrace = pretty ? `\n${this.getIndentation()}}` : "}";

    return `${openBrace}${items.join(separator)}${closeBrace}`;
  }
}

export const stringify = function (value, options = {}) {
  const stringifier = new Stringifier(options);
  return stringifier.stringify(value, options.pretty !== false);
};