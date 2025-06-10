import type { HighlightItem } from '../types/index.js';

export function getGlobalOffset(
  root: HTMLElement,
  node: Node,
  offsetInNode: number,
): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let offset = 0;
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current === node) {
      return offset + offsetInNode;
    }
    offset += current.textContent?.length || 0;
  }
  return offset;
}

// Trả về HTML mới với các đoạn text từ startOffset đến endOffset được bọc bởi <mark> chứa data-id.
// Giữ nguyên cấu trúc HTML (thẻ <p>, <img>, <div>,...).
// Hỗ trợ nested highlight nếu các vùng bôi trùng nhau.
export function restoreHighlightsFromOffsetsPreserveHTML(
  html: string, // đoạn nội dung HTML gốc
  highlights: HighlightItem[],
): string {
  if (!highlights || highlights.length === 0) return html;

  // Dùng div để làm vùng DOM ảo giúp xử lý DOM mà không ảnh hưởng đến nội dung gốc.
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  // Collect tất cả text nodes với global positions
  const textNodeInfos: {
    node: Text;
    globalStart: number;
    globalEnd: number;
  }[] = [];
  let globalOffset = 0;
  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, null);
  let currentNode: Text | null;

  while ((currentNode = walker.nextNode() as Text | null)) {
    const length = currentNode.nodeValue?.length || 0;
    textNodeInfos.push({
      node: currentNode,
      globalStart: globalOffset,
      globalEnd: globalOffset + length,
    });
    globalOffset += length;
  }

  // Sort highlights theo thứ tự startOffset → Đảm bảo xử lý highlight theo thứ tự xuất hiện.
  const sortedHighlights = [...highlights].sort(
    (a, b) => a.startOffset - b.startOffset,
  );

  // Xử lý từng highlight
  sortedHighlights.forEach((highlight) => {
    const { startOffset, endOffset, id } = highlight;

    // Tìm tất cả text nodes mà highlight này overlap
    const affectedTextNodes = textNodeInfos.filter(
      (info) =>
        !(endOffset <= info.globalStart || startOffset >= info.globalEnd),
    );

    if (affectedTextNodes.length === 0) return;

    // Xử lý từng text node bị ảnh hưởng
    affectedTextNodes.forEach((info) => {
      const { node, globalStart, globalEnd } = info;
      const nodeText = node.nodeValue || '';

      // Tính toán phần nào của text node này cần được highlight
      const highlightStart = Math.max(0, startOffset - globalStart);
      const highlightEnd = Math.min(nodeText.length, endOffset - globalStart);

      // Nếu highlight không cover bất kỳ phần nào của node này
      if (
        highlightStart >= highlightEnd ||
        highlightStart >= nodeText.length ||
        highlightEnd <= 0
      ) {
        return;
      }

      const parent = node.parentNode;
      if (!parent) return;

      // Kiểm tra xem node này đã được wrap bởi mark element chưa
      const existingMark =
        node.parentElement?.tagName === 'MARK' ? node.parentElement : null;

      if (existingMark && existingMark.getAttribute('data-id')) {
        // Node đã được highlight, cần xử lý nested highlighting
        // Tạo nested mark
        const nestedMark = document.createElement('mark');
        nestedMark.setAttribute('data-id', id);
        nestedMark.style.backgroundColor = '#FFE399';
        nestedMark.style.outline = '1px solid #FFA500';

        // Extract phần text cần highlight
        const beforeText = nodeText.slice(0, highlightStart);
        const highlightText = nodeText.slice(highlightStart, highlightEnd);
        const afterText = nodeText.slice(highlightEnd);

        // Clear node content
        node.nodeValue = '';

        if (beforeText) {
          existingMark.appendChild(document.createTextNode(beforeText));
        }

        nestedMark.appendChild(document.createTextNode(highlightText));
        existingMark.appendChild(nestedMark);

        if (afterText) {
          existingMark.appendChild(document.createTextNode(afterText));
        }
      } else {
        // Normal highlighting
        const beforeText = nodeText.slice(0, highlightStart);
        const highlightText = nodeText.slice(highlightStart, highlightEnd);
        const afterText = nodeText.slice(highlightEnd);

        // Create fragments
        const fragments: Node[] = [];

        if (beforeText) {
          fragments.push(document.createTextNode(beforeText));
        }

        if (highlightText) {
          const mark = document.createElement('mark');
          mark.setAttribute('data-id', id);
          mark.style.backgroundColor = '#FFE399';
          mark.appendChild(document.createTextNode(highlightText));
          fragments.push(mark);
        }

        if (afterText) {
          fragments.push(document.createTextNode(afterText));
        }

        // Replace original node
        fragments.forEach((fragment) => {
          parent.insertBefore(fragment, node);
        });
        parent.removeChild(node);

        // Update textNodeInfos for remaining processing
        if (afterText) {
          const newTextNode = fragments[fragments.length - 1] as Text;
          const originalInfo = textNodeInfos.find((info) => info.node === node);
          if (originalInfo) {
            const newGlobalStart =
              originalInfo.globalStart + highlightStart + highlightText.length;
            textNodeInfos.push({
              node: newTextNode,
              globalStart: newGlobalStart,
              globalEnd: originalInfo.globalEnd,
            });
          }
        }
      }
    });

    // Refresh textNodeInfos sau mỗi highlight để có thông tin chính xác cho highlight tiếp theo
    textNodeInfos.length = 0;
    globalOffset = 0;
    const newWalker = document.createTreeWalker(
      wrapper,
      NodeFilter.SHOW_TEXT,
      null,
    );
    let newCurrentNode: Text | null;

    while ((newCurrentNode = newWalker.nextNode() as Text | null)) {
      const length = newCurrentNode.nodeValue?.length || 0;
      textNodeInfos.push({
        node: newCurrentNode,
        globalStart: globalOffset,
        globalEnd: globalOffset + length,
      });
      globalOffset += length;
    }
  });

  return wrapper.innerHTML;
}
