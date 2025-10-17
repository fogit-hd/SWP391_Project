import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Space,
  Divider,
  message,
  Tabs,
  Modal,
  Typography,
  Tag,
  Tooltip,
  Row,
  Col,
  Dropdown,
  Menu,
} from "antd";
import {
  SaveOutlined,
  EyeOutlined,
  DownloadOutlined,
  UndoOutlined,
  RedoOutlined,
  CodeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./ContractEditor.css";

// Import Quill modules
const Delta = Quill.import("delta");
const Parchment = Quill.import("parchment");

/**
 * ==================== CONTRACT EDITOR COMPONENT ====================
 *
 * Advanced Rich Text Editor với Dynamic Variables cho Contract Templates
 *
 * 🚀 TÍNH NĂNG CHÍNH:
 * - Rich text editing với Quill.js
 * - Dynamic variable insertion và highlighting
 * - Copy-paste preservation của variables
 * - Real-time variable highlighting
 * - Dropdown menu cho variable insertion
 * - Template validation và preview
 *
 * 📋 PROPS:
 * - initialContent: Nội dung HTML ban đầu
 * - onSave: Callback khi save template
 * - onPreview: Callback khi preview
 * - loading: Trạng thái loading
 * - placeholder: Placeholder text cho editor
 * - variables: Array variables từ template (lấy từ API)
 * - clauses: Array clauses từ template (lấy từ API)
 *
 * 🔧 CÁC FUNCTION CHÍNH:
 * - highlightVariables(): Tự động highlight {{ variable }} trong content
 * - insertVariable(): Chèn variable đơn vào editor
 * - insertClauseLoop(): Chèn template loop cho clauses
 * - insertVariableLoop(): Chèn template loop cho variables
 * - createVariablesMenu(): Tạo dropdown menu cho variables
 * - handleSave(): Xử lý save template với validation
 * - handleDownload(): Tải xuống HTML file
 *
 * 🎨 UI COMPONENTS:
 * - Card container với toolbar
 * - Tabs: Editor/HTML view
 * - Dropdown: Variables menu
 * - Modal: Placeholder documentation
 *
 * 💾 DATA FLOW:
 * 1. Load variables/clauses từ API → Truyền vào props
 * 2. User click dropdown → Chọn variable → insertVariable()
 * 3. Editor content change → highlightVariables() → Auto highlight
 * 4. Copy/paste → Clipboard matchers → Preserve highlighting
 * 5. Save → handleSave() → onSave callback → API
 *
 * 🔍 TECHNICAL DETAILS:
 * - Custom Quill Blot: VariableHighlight
 * - Clipboard matchers: Preserve variables khi copy-paste
 * - Real-time highlighting: Auto-detect {{ variable }} patterns
 * - CSS classes: .variable-highlight cho styling
 */
const ContractEditor = ({
  initialContent = "",
  onSave,
  onPreview,
  loading = false,
  placeholder = "Nhập nội dung template hợp đồng...",
  variables = [], // Danh sách variables từ template
  clauses = [], // Danh sách clauses từ template
}) => {
  // ==================== STATE VARIABLES ====================
  /**
   * Các biến state chính:
   * - quillRef: Reference đến Quill instance để truy cập từ bên ngoài
   * - editorRef: Reference đến DOM element chứa editor
   * - quill: State lưu trữ Quill instance đã khởi tạo
   * - content: State lưu trữ nội dung HTML hiện tại của editor
   * - isPreviewMode: State điều khiển chế độ preview/editor
   * - activeTab: State điều khiển tab hiện tại (editor/html)
   * - showPlaceholderModal: State điều khiển modal hướng dẫn placeholders
   * - quillInitialized: Ref để tránh khởi tạo Quill nhiều lần
   */
  const quillRef = useRef(null); // Reference đến Quill instance
  const editorRef = useRef(null); // Reference đến DOM element editor
  const [quill, setQuill] = useState(null); // State lưu Quill instance
  const [content, setContent] = useState(initialContent); // State lưu nội dung HTML
  const [activeTab, setActiveTab] = useState("editor"); // Tab hiện tại
  const quillInitialized = useRef(false); // Tránh khởi tạo lại Quill

  // ==================== QUILL EDITOR INITIALIZATION ====================
  /**
   * Khởi tạo Quill Editor với các tính năng custom:
   * - Custom Blot cho variable highlighting
   * - Clipboard matchers để preserve variables khi copy-paste
   * - Auto-highlighting variables
   */
  useEffect(() => {
    if (editorRef.current && !quillInitialized.current) {
      quillInitialized.current = true;
      // Clear the container first to prevent duplicate toolbars
      editorRef.current.innerHTML = "";

      // ==================== CUSTOM VARIABLE BLOT ====================
      /**
       * Tạo custom Blot để highlight variables trong editor
       * Blot này sẽ wrap các variables trong span với class và data attributes
       */
      const VariableBlot = Quill.import("blots/inline");

      class VariableHighlight extends VariableBlot {
        // Tên của custom blot này
        static blotName = "variable-highlight";
        // HTML tag được sử dụng để render
        static tagName = "span";
        // CSS class được áp dụng
        static className = "variable-highlight";

        /**
         * Tạo DOM node cho variable highlight
         * @param {string} value - Tên biến (VD: "ContractDate")
         * @returns {HTMLElement} - DOM element được tạo
         */
        static create(value) {
          const node = super.create();
          node.setAttribute("class", "variable-highlight"); // CSS class
          node.setAttribute("data-variable", value); // Lưu tên biến
          // Không set contenteditable=false để có thể xóa được
          return node;
        }

        /**
         * Lấy giá trị từ DOM node
         * @param {HTMLElement} node - DOM node
         * @returns {string} - Tên biến
         */
        static formats(node) {
          return node.getAttribute("data-variable");
        }

        /**
         * Format lại node với giá trị mới
         * @param {string} name - Tên format
         * @param {string} value - Giá trị mới
         */
        format(name, value) {
          if (name !== this.constructor.blotName || !value) {
            super.format(name, value);
          } else {
            this.domNode.setAttribute("data-variable", value);
          }
        }
      }

      // Register the custom blot
      Quill.register(VariableHighlight);

      // ==================== QUILL CONFIGURATION ====================
      /**
       * Cấu hình Quill Editor với:
       * - Rich text toolbar
       * - Custom formats bao gồm variable-highlight
       * - Clipboard matchers để preserve variables
       * - History management
       */
      const quillInstance = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: placeholder,
        modules: {
          toolbar: [
            // Text formatting
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ script: "sub" }, { script: "super" }],

            // Lists and alignment
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],

            // Spacing and formatting
            [{ direction: "rtl" }],
            [{ size: ["small", false, "large", "huge"] }],
            [{ font: [] }],

            ["blockquote", "code-block"],

            // Insert elements
            ["link", "image", "video"],

            // Table
            ["table"],

            // Clean up
            ["clean"],

            // Undo/Redo
            ["undo", "redo"],
          ],
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true,
          },
          clipboard: {
            // Preserve custom formats when pasting
            matchVisual: false,
          },
          table: true,
        },
        formats: [
          "header",
          "font",
          "size",
          "bold",
          "italic",
          "underline",
          "strike",
          "color",
          "background",
          "script",
          "list",
          "bullet",
          "indent",
          "direction",
          "align",
          "link",
          "image",
          "video",
          "blockquote",
          "code-block",
          "variable-highlight",
          "table",
          "table-cell",
          "table-row",
        ],
      });

      // Set initial content từ state content (để giữ content cũ)
      if (content) {
        quillInstance.root.innerHTML = content;
      }

      // Inject CSS để force table chỉ có 4 cột
      const style = document.createElement('style');
      style.textContent = `
        .ql-editor table {
          border-collapse: collapse !important;
          margin: 10px 0;
          width: 100% !important;
          display: table !important;
          table-layout: fixed !important;
          border: 1px solid #ccc;
        }
        .ql-editor table td,
        .ql-editor table th {
          border: 1px solid #ccc !important;
          padding: 8px !important;
          text-align: left !important;
          display: table-cell !important;
          vertical-align: top !important;
          max-width: 200px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ql-editor table th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
        }
        .ql-editor table tr {
          display: table-row !important;
        }
        .ql-editor table thead {
          display: table-header-group !important;
        }
        .ql-editor table tbody {
          display: table-row-group !important;
        }
        /* Force chỉ có 4 cột */
        .ql-editor table tr > *:nth-child(5),
        .ql-editor table tr > *:nth-child(6),
        .ql-editor table tr > *:nth-child(7),
        .ql-editor table tr > *:nth-child(8),
        .ql-editor table tr > *:nth-child(9),
        .ql-editor table tr > *:nth-child(n+5) {
          display: none !important;
        }
        .ql-editor .variable-highlight {
          background-color: #e6f3ff;
          border: 1px solid #1890ff;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          display: inline-block;
        }
        .ql-editor .ql-variable {
          background-color: #e6f3ff;
          border: 1px solid #1890ff;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          display: inline-block;
        }
      `;
      document.head.appendChild(style);


      // ==================== EVENT HANDLERS ====================
      /**
       * Listen for content changes và auto-highlight variables
       */
      quillInstance.on("text-change", () => {
        const html = quillInstance.root.innerHTML;
        setContent(html);
        // Auto-highlight variables after content change với debounce
        setTimeout(() => {
          highlightVariables(quillInstance);
        }, 200);
      });

      // Event handler cho selection change để highlight variables khi được select
      quillInstance.on("selection-change", (range, oldRange, source) => {
        if (range && range.length > 0) {
          // Nếu có selection, kiểm tra xem có phải variable không
          const selectedText = quillInstance.getText(range.index, range.length);
          if (
            selectedText &&
            selectedText.includes("{{") &&
            selectedText.includes("}}")
          ) {
            // Highlight variable khi được select
            const variableElements = quillInstance.container.querySelectorAll(
              ".variable-highlight"
            );
            variableElements.forEach((el) => {
              if (el.textContent.includes(selectedText.trim())) {
                el.classList.add("selected");
              } else {
                el.classList.remove("selected");
              }
            });
          }
        } else {
          // Remove highlight khi không có selection
          const variableElements = quillInstance.container.querySelectorAll(
            ".variable-highlight"
          );
          variableElements.forEach((el) => {
            el.classList.remove("selected");
          });
        }
      });

      // ==================== CLIPBOARD MATCHERS ====================
      /**
       * Clipboard matchers để preserve variables khi copy-paste:
       * - Element matcher: preserve highlighted variables
       * - Text matcher: detect và highlight variables trong plain text
       */
      /**
       * Matcher 1: Xử lý khi paste element đã được highlight
       * Khi copy-paste một variable đã được highlight, giữ nguyên format
       *
       * Node constants trong DOM:
       * - 1 = ELEMENT_NODE: Node là HTML element (ví dụ: <span>, <div>, <p>)
       * - 3 = TEXT_NODE: Node là text thuần (không có HTML tags)
       *
       * Ở đây chúng ta dùng ELEMENT_NODE (1) để bắt các element HTML
       * được paste vào editor, đặc biệt là các <span class="variable-highlight">
       */
      quillInstance.clipboard.addMatcher(1, (node, delta) => {
        // 1 = ELEMENT_NODE
        if (node.classList && node.classList.contains("variable-highlight")) {
          const variableName = node.getAttribute("data-variable"); // Lấy tên biến
          // Trả về Delta với format variable-highlight
          return new Delta().insert(node.textContent, {
            "variable-highlight": variableName,
          });
        }
        return delta;
      });

      /**
       * Matcher 2: Xử lý khi paste text thô chứa variables
       * Tự động detect và highlight các patterns {{ variableName }}
       *
       * Dùng TEXT_NODE (3) để bắt text thuần được paste:
       * - Khi user copy text từ nơi khác (ví dụ: từ Word, Notepad)
       * - Text chứa pattern {{ variableName }} sẽ được tự động highlight
       * - Ví dụ: "Ngày ký: {{ ContractDate }}" → tự động thành highlighted variable
       */
      quillInstance.clipboard.addMatcher(3, (node, delta) => {
        // 3 = TEXT_NODE
        const text = node.data; // Nội dung text được paste
        const variableRegex = /\{\{([^}]+)\}\}/g; // Regex tìm variables (không có khoảng trắng)
        let match;
        const ops = []; // Array chứa các operations
        let lastIndex = 0; // Vị trí cuối cùng đã xử lý

        // Tìm tất cả variables trong text
        while ((match = variableRegex.exec(text)) !== null) {
          // Thêm text trước variable
          if (match.index > lastIndex) {
            ops.push({ insert: text.slice(lastIndex, match.index) });
          }
          // Thêm variable với highlight
          ops.push({
            insert: match[0], // Toàn bộ {{ variableName }}
            attributes: { "variable-highlight": match[1] }, // Tên biến (không có khoảng trắng)
          });
          lastIndex = match.index + match[0].length;
        }

        // Thêm text còn lại
        if (lastIndex < text.length) {
          ops.push({ insert: text.slice(lastIndex) });
        }

        return ops.length > 0 ? new Delta(ops) : delta;
      });

      setQuill(quillInstance);

      // Debug: Log khi Quill được khởi tạo
      console.log("Quill editor initialized successfully");

      // Đảm bảo editor được focus sau khi khởi tạo
      setTimeout(() => {
        quillInstance.focus();
      }, 100);
    }

    // Cleanup function
    return () => {
      if (quill) {
        quill = null;
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Update content khi có thay đổi từ bên ngoài (chỉ khi content thực sự khác)
  useEffect(() => {
    if (quill && initialContent && initialContent !== content) {
      quill.root.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  // Chuyển đổi HTML thành text với \n cho backend
  const convertHtmlToText = (html) => {
    // Tạo một div tạm để parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Chuyển đổi các thẻ HTML thành text với xuống dòng
    let text = tempDiv.textContent || tempDiv.innerText || "";

    // Thay thế các ký tự đặc biệt
    text = text.replace(/\n/g, "\\n");
    text = text.replace(/\t/g, "\\t");
    text = text.replace(/\r/g, "\\r");

    return text;
  };

  // Chuyển đổi HTML thành format backend-friendly
  const convertHtmlForBackend = (html) => {
    // Tạo một div tạm để parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Lấy text content nhưng giữ lại các dynamic variables
    let content = tempDiv.innerHTML;

    // Đảm bảo các dynamic variables được giữ nguyên
    // Thay thế các ký tự xuống dòng trong HTML
    content = content.replace(/\n/g, "\\n");
    content = content.replace(/\r/g, "\\r");

    return content;
  };

  // Validate template content for backend compatibility
  const validateTemplateContent = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const issues = [];
    const content = tempDiv.innerHTML;

    // Check for unclosed loop variables
    const loopOpenMatches = content.match(/\{\{#\w+\}\}/g) || [];
    const loopCloseMatches = content.match(/\{\{\/\w+\}\}/g) || [];

    if (loopOpenMatches.length !== loopCloseMatches.length) {
      issues.push({
        type: "warning",
        message:
          "Unclosed loop variables detected. Make sure all {{#variable}} have corresponding {{/variable}}",
      });
    }

    // Check for common variable patterns
    const simpleVariables = content.match(/\{\{[^#\/][^}]*\}\}/g) || [];
    const loopVariables = content.match(/\{\{#\w+\}\}/g) || [];

    console.log("=== TEMPLATE VALIDATION ===");
    console.log("Simple Variables:", simpleVariables);
    console.log("Loop Variables:", loopVariables);
    console.log("Issues:", issues);

    return {
      isValid: issues.length === 0,
      issues,
      variableCount: simpleVariables.length,
      loopCount: loopVariables.length,
    };
  };

  // Chuyển đổi text thành HTML cho hiển thị
  // const convertTextToHtml = (text) => {
  //   return (
  //     text
  //       // .replace(/\\n/g, '<br>')
  //       .replace(/\\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
  //       .replace(/\\r/g, "")
  //   );
  // };

  /**
   * Function clean HTML để gửi về BE - loại bỏ span tags, chỉ giữ Mustache syntax
   * @param {string} html - HTML từ editor
   * @returns {string} - Clean HTML cho BE
   */
  const cleanMustacheForBackend = (html) => {
    console.log("=== CLEANING MUSTACHE FOR BACKEND ===");
    console.log("Input HTML:", html);

    // Tìm tất cả thẻ span có data-variable và thay bằng {{VariableName}}
    let cleanHtml = html.replace(
      /<span[^>]*data-variable="([^"]+)"[^>]*>{{[^}]+}}<\/span>/g,
      (match, variable) => {
        console.log(`Replacing: "${match}" -> "{{${variable}}}"`);
        return `{{${variable}}}`;
      }
    );

    // Xử lý trường hợp đặc biệt cho loop variables (đã được xử lý ở trên, nhưng để chắc chắn)
    cleanHtml = cleanHtml.replace(
      /<span[^>]*data-variable="(#\w+)"[^>]*>{{[^}]+}}<\/span>/g,
      (match, variable) => {
        console.log(`Replacing loop open: "${match}" -> "{{${variable}}}"`);
        return `{{${variable}}}`;
      }
    );

    cleanHtml = cleanHtml.replace(
      /<span[^>]*data-variable="(\/\w+)"[^>]*>{{[^}]+}}<\/span>/g,
      (match, variable) => {
        console.log(`Replacing loop close: "${match}" -> "{{${variable}}}"`);
        return `{{${variable}}}`;
      }
    );

    console.log("Output HTML:", cleanHtml);
    return cleanHtml;
  };

  const handleSave = () => {
    if (!quill) return;

    const htmlContent = quill.root.innerHTML;
    const cleanHtmlForBackend = cleanMustacheForBackend(htmlContent); // Clean HTML cho BE
    const textContent = convertHtmlToText(htmlContent);
    const backendContent = convertHtmlForBackend(cleanHtmlForBackend);
    const validation = validateTemplateContent(cleanHtmlForBackend);

    console.log("=== SAVING TEMPLATE CONTENT ===");
    console.log("Original HTML (Editor):", htmlContent);
    console.log("Clean HTML (Backend):", cleanHtmlForBackend);
    console.log("Text Content:", textContent);
    console.log("Backend Content:", backendContent);
    console.log("Validation Result:", validation);

    // Show validation warnings if any
    if (!validation.isValid) {
      validation.issues.forEach((issue) => {
        if (issue.type === "warning") {
          message.warning(issue.message);
        } else {
          message.error(issue.message);
        }
      });
    }

    if (onSave) {
      onSave({
        html: htmlContent, // HTML gốc cho editor
        cleanHtml: cleanHtmlForBackend, // HTML clean cho BE
        text: textContent,
        backendHtml: backendContent,
        validation: validation,
      });
    }
  };

  const handleUndo = () => {
    if (quill) {
      quill.history.undo();
    }
  };

  const handleRedo = () => {
    if (quill) {
      quill.history.redo();
    }
  };

  // ==================== VARIABLE HIGHLIGHTING FUNCTIONS ====================
  /**
   * Function để highlight variables trong content
   * Tìm tất cả patterns {{ variableName }} và apply variable-highlight format
   */
  /**
   * Function chính để highlight variables trong editor
   * @param {Object} quillInstance - Instance của Quill editor
   *
   * Quy trình:
   * 1. Lấy text thô từ editor
   * 2. Dùng regex tìm tất cả patterns {{ variableName }}
   * 3. Apply format 'variable-highlight' cho từng variable
   */
  const highlightVariables = (quillInstance) => {
    if (!quillInstance) return;

    const text = quillInstance.getText(); // Lấy text thô từ editor
    const variableRegex = /\{\{([^}]+)\}\}/g; // Regex tìm {{variable}} (không có khoảng trắng)
    let match;
    const ranges = []; // Array lưu thông tin các variables tìm được

    // Tìm tất cả variables trong text
    while ((match = variableRegex.exec(text)) !== null) {
      ranges.push({
        index: match.index, // Vị trí bắt đầu trong text
        length: match[0].length, // Độ dài của toàn bộ {{ variable }}
        variableName: match[1], // Tên biến (không có khoảng trắng)
      });
    }

    // Apply highlighting cho từng variable
    ranges.forEach(({ index, length, variableName }) => {
      try {
        // Chỉ apply format nếu chưa được highlight
        const format = quillInstance.getFormat(index, length);
        if (!format["variable-highlight"]) {
          quillInstance.formatText(
            index,
            length,
            "variable-highlight",
            variableName
          );
        }
      } catch (error) {
        console.warn("Error highlighting variable:", error);
      }
    });
  };

  // ==================== VARIABLE INSERTION FUNCTIONS ====================
  /**
   * Function chung để chèn placeholder vào editor
   * @param {string} placeholder - Text hoặc HTML cần chèn (VD: "{{ ContractDate }}" hoặc HTML)
   * @param {boolean} isHtml - Có phải HTML không (default: false)
   */
  const insertPlaceholder = (placeholder, isHtml = false) => {
    if (!quill) return;

    // Lấy vị trí cursor hiện tại
    let range = quill.getSelection();

    // Nếu không có selection, tạo selection ở cuối document
    if (!range) {
      const length = quill.getLength();
      range = { index: length - 1, length: 0 };
      quill.setSelection(range.index, range.length);
    }

    if (isHtml) {
      // Insert HTML tại vị trí cursor
      quill.clipboard.dangerouslyPasteHTML(range.index, placeholder);
      
      // Nếu có table trong HTML, cần format lại để Quill hiển thị đúng
      if (placeholder.includes('<table')) {
        setTimeout(() => {
          // Force re-render để table hiển thị đúng
          const html = quill.root.innerHTML;
          quill.root.innerHTML = html;
        }, 100);
      }
      
      // Di chuyển cursor đến cuối content vừa insert
      const length = quill.getLength();
      quill.setSelection(length - 1);
    } else {
      // Insert text tại vị trí cursor
      quill.insertText(range.index, placeholder);
      // Di chuyển cursor đến cuối text vừa insert
      quill.setSelection(range.index + placeholder.length);
    }

    // Focus lại editor để đảm bảo cursor visible
    quill.focus();

    // Highlight variables sau khi insert với delay ngắn hơn
    setTimeout(() => {
      highlightVariables(quill);
    }, 50);
  };

  /**
   * Function chèn variable đơn
   * @param {string} variableName - Tên biến (VD: "ContractDate")
   * Tạo placeholder dạng: "{{ContractDate}}"
   */
  const insertVariable = (variableName) => {
    const placeholder = `{{${variableName}}}`;
    insertPlaceholder(placeholder);
  };

  /**
   * Function chèn clause loop template
   * Tạo template để lặp qua tất cả clauses
   */
  const insertClauseLoop = () => {
    const htmlPlaceholder = `<div class="clause-loop">{{#Clauses}}<h4>{{Title}}</h4><p>{{Body}}</p>{{/Clauses}}</div>`;
    insertPlaceholder(htmlPlaceholder, true); // isHtml = true
  };

  /**
   * Function chèn CoOwner loop template
   * Tạo template để lặp qua tất cả CoOwners
   */
  const insertCoOwnerLoop = () => {
    if (!quill) return;

    // Lấy vị trí cursor hiện tại
    let range = quill.getSelection();
    if (!range) {
      const length = quill.getLength();
      range = { index: length - 1, length: 0 };
      quill.setSelection(range.index, range.length);
    }

    // Tạo HTML table với loop bao bọc toàn bộ table - FORCE TABLE STRUCTURE
    const tableHtml = `{{#CoOwners}}<br><table style="border-collapse: collapse; width: 100%; table-layout: fixed;"><tr><td style="width: 30%; border: 1px solid #ccc; background-color: #f5f5f5; font-weight: bold; padding: 8px;">Họ tên</td><td style="width: 20%; border: 1px solid #ccc; background-color: #f5f5f5; font-weight: bold; padding: 8px;">CCCD</td><td style="width: 15%; border: 1px solid #ccc; background-color: #f5f5f5; font-weight: bold; padding: 8px;">Tỷ lệ (%)</td><td style="width: 35%; border: 1px solid #ccc; background-color: #f5f5f5; font-weight: bold; padding: 8px;">Địa chỉ</td></tr><tr><td style="width: 30%; border: 1px solid #ccc; padding: 8px;">{{FullName}}</td><td style="width: 20%; border: 1px solid #ccc; padding: 8px;">{{CitizenId}}</td><td style="width: 15%; border: 1px solid #ccc; padding: 8px;">{{OwnershipRate}}</td><td style="width: 35%; border: 1px solid #ccc; padding: 8px;">{{Address}}</td></tr></table>{{/CoOwners}}`;

    // Insert HTML table
    quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
    
    // Force re-render để table hiển thị đúng
    setTimeout(() => {
      const html = quill.root.innerHTML;
      quill.root.innerHTML = html;
      quill.focus();
      
      // Highlight variables sau khi insert
      setTimeout(() => {
        highlightVariables(quill);
      }, 100);
    }, 100);
  };

  // ==================== DROPDOWN MENU FUNCTIONS ====================
  /**
   * Function tạo dropdown menu cho variables
   * @returns {Object} - Menu items cho Dropdown component
   *
   * Menu bao gồm:
   * - Header hiển thị số lượng variables
   * - Danh sách variables có thể chèn
   * - Separator
   * - Loop templates (clause loop, variable loop)
   */
  const createVariablesMenu = () => {
    // Nếu không có variables, hiển thị thông báo
    if (!variables || variables.length === 0) {
      return {
        items: [
          {
            key: "no-variables",
            label: (
              <div
                style={{
                  padding: "8px 16px",
                  color: "#999",
                  textAlign: "center",
                }}
              >
                No variables available
              </div>
            ),
            disabled: true,
          },
        ],
      };
    }

    // Tạo menu items cho từng variable từ props variables
    const menuItems = variables.map((variable, index) => ({
      key: `var-${index}`, // Unique key cho menu item
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 0",
            minWidth: "200px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Tag
              color="blue"
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                marginRight: 8,
              }}
            >
              {`{{${variable.variableName}}}`}
              {/* Hiển thị format variable */}
            </Tag>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {variable.displayLabel} {/* Hiển thị nhãn mô tả */}
          </div>
        </div>
      ),
      onClick: () => insertVariable(variable.variableName), // Gọi function chèn variable
    }));

    // Tạo các menu items đặc biệt (loop templates)
    const specialItems = [
      {
        key: "divider-1",
        type: "divider", // Đường kẻ phân cách
      },
      {
        key: "header-loops",
        label: (
          <div
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#1890ff",
              backgroundColor: "#f0f8ff",
            }}
          >
            Loop Templates {/* Header cho phần loop templates */}
          </div>
        ),
        disabled: true, // Không thể click
      },
      {
        key: "clause-loop",
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 0",
              minWidth: "200px",
            }}
          >
            <Tag
              color="green"
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                marginRight: 8,
              }}
            >
              {"{{#clause}}...{{/clause}}"} {/* Template cho clause loop */}
            </Tag>
            <span style={{ fontSize: "12px", color: "#666" }}>
              Insert Clause Loop
            </span>
          </div>
        ),
        onClick: insertClauseLoop, // Gọi function chèn clause loop
      },
      {
        key: "coowner-loop",
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 0",
              minWidth: "200px",
            }}
          >
            <Tag
              color="orange"
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                marginRight: 8,
              }}
            >
              {"{{#CoOwners}}...{{/CoOwners}}"}{" "}
              {/* Template cho CoOwner loop */}
            </Tag>
            <span style={{ fontSize: "12px", color: "#666" }}>
              Insert CoOwner Loop
            </span>
          </div>
        ),
        onClick: insertCoOwnerLoop, // Gọi function chèn CoOwner loop
      },
    ];

    // Trả về menu items hoàn chỉnh
    return {
      items: [
        {
          key: "header-variables",
          label: (
            <div
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#1890ff",
                backgroundColor: "#f0f8ff",
              }}
            >
              Variables ({variables.length}){" "}
              {/* Header hiển thị số lượng variables */}
            </div>
          ),
          disabled: true,
        },
        ...menuItems, // Danh sách variables
        ...specialItems, // Loop templates
      ],
    };
  };

  // ==================== FILE HANDLING FUNCTIONS ====================
  /**
   * Function tải xuống contract dưới dạng HTML file
   * Lấy nội dung từ editor và tạo file HTML hoàn chỉnh
   */
  const handleDownload = () => {
    if (!quill) return;

    const htmlContent = quill.root.innerHTML; // Lấy HTML content từ editor
    // const textContent = convertHtmlToText(htmlContent); // Convert sang text

    // Tạo file HTML hoàn chỉnh với CSS styling
    const htmlBlob = new Blob(
      [
        `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract Document</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1, h2, h3, h4, h5, h6 { color: #333; }
          p { margin-bottom: 10px; }
          .contract-header { text-align: center; margin-bottom: 30px; }
          .contract-footer { margin-top: 50px; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `,
      ],
      { type: "text/html" }
    );

    // Tạo và trigger download
    const url = URL.createObjectURL(htmlBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Cleanup memory

    message.success("Contract downloaded successfully!");
  };

  // ==================== TAB CONFIGURATION ====================
  /**
   * Cấu hình các tabs cho editor:
   * - Editor tab: Hiển thị Quill editor hoặc preview mode
   * - HTML tab: Hiển thị source code HTML
   */
  const tabItems = [
    {
      key: "editor", // Key của tab
      label: (
        <span>
          <FileTextOutlined />
          Editor {/* Tên tab */}
        </span>
      ),
      children: (
        <div style={{ height: "600px" }}>
          {/* Edit mode: Hiển thị Quill editor */}
            <div
              ref={editorRef} // Reference đến editor container
              style={{ height: "100%" }}
              className="contract-editor"
            />
        </div>
      ),
    },
    {
      key: "html", // Key của HTML tab
      label: (
        <span>
          <CodeOutlined />
          HTML Code {/* Tên tab */}
        </span>
      ),
      children: (
        <div style={{ height: "600px" }}>
          <pre
            style={{
              height: "100%",
              padding: "20px",
              border: "none",
              backgroundColor: "#ffffff",
              overflow: "auto",
              fontSize: "12px",
              lineHeight: "1.4",
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            }}
          >
            {quill ? quill.root.innerHTML : content}{" "}
            {/* Hiển thị HTML source */}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Template Editor"
      style={{ height: "100%" }}
      extra={
        <Space>
          <Button icon={<UndoOutlined />} onClick={handleUndo} title="Undo" />
          <Button icon={<RedoOutlined />} onClick={handleRedo} title="Redo" />
              <Divider type="vertical" />

          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            title="Download as HTML"
          >
            Download
          </Button>

          {/* Variables dropdown menu */}
          <Dropdown
            menu={createVariablesMenu()} // Menu được tạo từ function createVariablesMenu()
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button icon={<PlusOutlined />} title="Insert Variables & Loops">
              Insert Variables
            </Button>
          </Dropdown>


          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
          >
            Save Template
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ height: "100%" }}
      />

      {/* Character count */}
      <div
        style={{
          marginTop: "10px",
          textAlign: "right",
          color: "#666",
          fontSize: "12px",
        }}
      >
        {content.length} characters
      </div>

    </Card>
  );
};

export default ContractEditor;
