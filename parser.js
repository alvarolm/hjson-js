class Parser {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.line = 1;
    this.ch = " ";
  }

  parse() {
    this.nextChar();
    this.skipWhitespace();
    const result = this.parseValue();
    this.skipWhitespace();
    if (this.pos < this.text.length) {
      throw new Error(`Unexpected character at position ${this.pos}`);
    }
    return result;
  }

  nextChar() {
    if (this.pos < this.text.length) {
      this.ch = this.text.charAt(this.pos++);
      if (this.ch === "\n") {
        this.line++;
      }
      return true;
    }
    return false;
  }

  skipWhitespace() {
    while (this.ch === " " || this.ch === "\t" || this.ch === "\n" || this.ch === "\r") {
      this.nextChar();
    }
    // Skip comments
    while (this.ch === "#" || (this.ch === "/" && (this.text[this.pos] === "/" || this.text[this.pos] === "*"))) {
      if (this.ch === "#" || this.text[this.pos] === "/") {
        // Single line comment
        while (this.ch !== "\n" && this.pos < this.text.length) {
          this.nextChar();
        }
      } else if (this.text[this.pos] === "*") {
        // Multi-line comment
        this.nextChar(); // Skip /
        this.nextChar(); // Skip *
        while (this.pos < this.text.length) {
          if (this.ch === "*" && this.text[this.pos] === "/") {
            this.nextChar(); // Skip *
            this.nextChar(); // Skip /
            break;
          }
          this.nextChar();
        }
      }
      this.skipWhitespace();
    }
  }

  parseValue() {
    this.skipWhitespace();

    switch (this.ch) {
      case "{":
        return this.parseObject();
      case "[":
        return this.parseArray();
      case '"':
        return this.parseJSONString();
      case "'": {
        // Check for multiline string
        if (this.text[this.pos] === "'" && this.text[this.pos + 1] === "'") {
          return this.parseMultilineString();
        }
        return this.parseQuotedString();
      }
      default: {
        if (this.ch === "-" || (this.ch >= "0" && this.ch <= "9")) {
          return this.parseNumber();
        }
        // Check for special values
        const specialValues = this.parseSpecialValue();
        if (specialValues !== undefined) {
          return specialValues;
        }
        // Quoteless string
        return this.parseQuotelessString();
      }
    }
  }

  parseObject() {
    const obj = {};
    this.nextChar(); // Skip {
    this.skipWhitespace();

    while (this.ch !== "}" && this.pos < this.text.length) {
      // Parse key
      let key;
      if (this.ch === '"') {
        key = this.parseJSONString();
      } else if (this.ch === "'") {
        if (this.text[this.pos] === "'" && this.text[this.pos + 1] === "'") {
          key = this.parseMultilineString();
        } else {
          key = this.parseQuotedString();
        }
      } else {
        key = this.parseQuotelessString();
      }

      this.skipWhitespace();

      // Optional colon
      if (this.ch === ":") {
        this.nextChar();
        this.skipWhitespace();
      }

      // Parse value
      const value = this.parseValue();
      obj[key] = value;

      this.skipWhitespace();

      // Optional comma
      if (this.ch === ",") {
        this.nextChar();
        this.skipWhitespace();
      }
    }

    if (this.ch === "}") {
      this.nextChar();
    }

    return obj;
  }

  parseArray() {
    const arr = [];
    this.nextChar(); // Skip [
    this.skipWhitespace();

    while (this.ch !== "]" && this.pos < this.text.length) {
      arr.push(this.parseValue());
      this.skipWhitespace();

      // Optional comma
      if (this.ch === ",") {
        this.nextChar();
        this.skipWhitespace();
      }
    }

    if (this.ch === "]") {
      this.nextChar();
    }

    return arr;
  }

  parseJSONString() {
    let str = "";
    this.nextChar(); // Skip opening quote

    while (this.ch !== '"' && this.pos < this.text.length) {
      if (this.ch === "\\") {
        this.nextChar();
        switch (this.ch) {
          case "b":
            str += "\b";
            break;
          case "f":
            str += "\f";
            break;
          case "n":
            str += "\n";
            break;
          case "r":
            str += "\r";
            break;
          case "t":
            str += "\t";
            break;
          case "u": {
            let hexValue = "";
            for (let i = 0; i < 4; i++) {
              this.nextChar();
              hexValue += this.ch;
            }
            str += String.fromCharCode(Number.parseInt(hexValue, 16));
            break;
          }
          default:
            str += this.ch;
        }
      } else {
        str += this.ch;
      }
      this.nextChar();
    }

    this.nextChar(); // Skip closing quote
    return str;
  }

  parseQuotedString() {
    let str = "";
    this.nextChar(); // Skip opening quote

    while (this.ch !== "'" && this.pos < this.text.length) {
      if (this.ch === "\\") {
        this.nextChar();
        switch (this.ch) {
          case "b":
            str += "\b";
            break;
          case "f":
            str += "\f";
            break;
          case "n":
            str += "\n";
            break;
          case "r":
            str += "\r";
            break;
          case "t":
            str += "\t";
            break;
          default:
            str += this.ch;
        }
      } else {
        str += this.ch;
      }
      this.nextChar();
    }

    this.nextChar(); // Skip closing quote
    return str;
  }

  parseMultilineString() {
    let str = "";
    let firstLine = true;
    let baseIndent = "";

    // Skip opening quotes
    this.nextChar(); // Skip first quote
    this.nextChar(); // Skip second quote
    this.nextChar(); // Skip third quote

    // Skip first newline if present
    if (this.ch === "\n") {
      this.nextChar();
      // Calculate base indentation of first line
      while (this.ch === " " || this.ch === "\t") {
        baseIndent += this.ch;
        this.nextChar();
      }
    }

    while (this.pos < this.text.length) {
      // Check for closing triple quotes
      if (this.ch === "'" && this.text[this.pos] === "'" && this.text[this.pos + 1] === "'") {
        this.nextChar(); // Skip first quote
        this.nextChar(); // Skip second quote
        this.nextChar(); // Skip third quote
        break;
      }

      // Handle newlines and indentation
      if (this.ch === "\n") {
        if (!firstLine) {
          str += "\n";
        }
        this.nextChar();

        // Skip base indentation
        let currentIndent = "";
        while ((this.ch === " " || this.ch === "\t") && currentIndent.length < baseIndent.length) {
          currentIndent += this.ch;
          this.nextChar();
        }
        firstLine = false;
      } else {
        str += this.ch;
        this.nextChar();
      }
    }

    return str.trim();
  }

  parseQuotelessString() {
    let str = "";
    while (this.pos <= this.text.length && this.ch !== "," && this.ch !== "}" && this.ch !== "]" && this.ch !== ":" && this.ch !== "\n") {
      str += this.ch;
      this.nextChar();
    }
    return str.trim();
  }

  parseNumber() {
    let numStr = "";
    if (this.ch === "-") {
      numStr += this.ch;
      this.nextChar();
    }

    while (this.ch >= "0" && this.ch <= "9") {
      numStr += this.ch;
      this.nextChar();
    }

    if (this.ch === ".") {
      numStr += this.ch;
      this.nextChar();
      while (this.ch >= "0" && this.ch <= "9") {
        numStr += this.ch;
        this.nextChar();
      }
    }

    if (this.ch === "e" || this.ch === "E") {
      numStr += this.ch;
      this.nextChar();
      if (this.ch === "+" || this.ch === "-") {
        numStr += this.ch;
        this.nextChar();
      }
      while (this.ch >= "0" && this.ch <= "9") {
        numStr += this.ch;
        this.nextChar();
      }
    }

    return Number.parseFloat(numStr);
  }

  parseSpecialValue() {
    const remaining = this.text.slice(this.pos - 1);
    if (remaining.startsWith("true")) {
      this.pos += 3;
      this.nextChar();
      return true;
    }
    if (remaining.startsWith("false")) {
      this.pos += 4;
      this.nextChar();
      return false;
    }
    if (remaining.startsWith("null")) {
      this.pos += 3;
      this.nextChar();
      return null;
    }
    return undefined;
  }
}

export function parse(text) {
  const parser = new Parser(text);
  return parser.parse();
}