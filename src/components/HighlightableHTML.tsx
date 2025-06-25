import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  Input,
  List,
  Modal,
  Popover,
} from 'antd';
import clsx from 'clsx';
import { doHighlight, optionsImpl } from '@funktechno/texthighlighter/lib';
import dayjs from 'dayjs';
import { PointerIcon, ShowCommentIcon } from './svg-icons';
import { calculateTimeAgo } from './utils';
import AvatarCard, { IUser } from './card/AvatarCard';
import ButtonSecondary from './button/ButtonSecondary';
import ButtonPrimary from './button/ButtonPrimary';

const { TextArea } = Input;
const DEBOUNCE_DELAY = 100;

export interface HighlightItem {
  id: string;
  text: string;
  note: string;
  noteTime: string;
  startOffset: number;
  endOffset: number;
}

interface Props {
  initialHTML: string;
  storageKey: string;
  isShowNote?: boolean;
  className?: string;
  user: IUser;
}

const HighlightableHTML: React.FC<Props> = ({
  initialHTML,
  storageKey,
  isShowNote = false,
  className,
  user,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const [html, setHtml] = useState<string>(initialHTML);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [selection, setSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  // Thêm state để track khi nào DOM đã được cập nhật
  const [isDOMReady, setIsDOMReady] = useState(false);
  const prevStorageKeyRef = useRef<string>(storageKey);

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [showNoteEditor, setShowNoteEditor] = useState<boolean>(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(
    null,
  );
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [lastRect, setLastRect] = useState<DOMRect | null>(null);
  const [isProtectingSelection, setIsProtectingSelection] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Debounce setSelectionRect để tránh scroll nháy
  const updateSelectionRect = (rect: DOMRect | null) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    setDebounceTimeout(
      setTimeout(() => {
        setSelectionRect(rect);
      }, DEBOUNCE_DELAY),
    );
  };

  // Load highlights from sessionStorage - chỉ chạy khi storageKey thay đổi
  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHtml(parsed.htmlContent || initialHTML);
        setHighlights(parsed.highlights || []);
      } catch (err) {
        setHtml(initialHTML);
        setHighlights([]);
      }
    } else {
      setHtml(initialHTML);
      setHighlights([]);
    }

    // Reset các state khi chuyển câu hỏi
    setSelection(null);
    setSelectionRect(null);
    setSelectedHighlightId(null);
    setHighlightRect(null);
    setShowNoteEditor(false);
    setNoteInput('');
    setIsDOMReady(false);

    prevStorageKeyRef.current = storageKey;
  }, [storageKey]);

  // Effect riêng để handle khi initialHTML thay đổi nhưng storageKey không đổi
  useEffect(() => {
    if (prevStorageKeyRef.current === storageKey) {
      // Nếu cùng storageKey nhưng initialHTML thay đổi, có thể là trường hợp đặc biệt
      // Kiểm tra xem có data trong storage không
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) {
        setHtml(initialHTML);
        setHighlights([]);
      }
    }
  }, [initialHTML, storageKey]);

  // Effect để đánh dấu DOM đã sẵn sàng
  useEffect(() => {
    if (containerRef.current && html) {
      // Sử dụng setTimeout để đảm bảo DOM đã được render
      const timer = setTimeout(() => {
        setIsDOMReady(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [html]);

  // Save highlights to sessionStorage - chỉ save khi DOM đã sẵn sàng
  useEffect(() => {
    if (containerRef.current && isDOMReady && highlights.length >= 0) {
      // Thêm một check để đảm bảo containerRef.current chứa nội dung đúng
      const currentHTML = containerRef.current.innerHTML;
      // Chỉ lưu nếu HTML hiện tại không rỗng hoặc có highlights
      if (currentHTML.trim() || highlights.length > 0) {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            htmlContent: currentHTML,
            highlights,
          }),
        );
      }
    }
  }, [highlights, storageKey, isDOMReady]);

  const handleMouseUp = () => {
    const selectionObj = window.getSelection();
    if (!selectionObj || selectionObj.isCollapsed) {
      if (selection) setSelection(null);
      if (selectionRect) setSelectionRect(null);
      return;
    }

    const range = selectionObj.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const container = containerRef.current;
    if (!container || !container.contains(selectionObj.anchorNode)) return;

    // So sánh rect mới với rect cũ
    if (
      lastRect &&
      Math.abs(rect.top - lastRect.top) < 1 &&
      Math.abs(rect.left - lastRect.left) < 1 &&
      Math.abs(rect.width - lastRect.width) < 1 &&
      Math.abs(rect.height - lastRect.height) < 1
    ) {
      return;
    }

    setLastRect(rect);
    setSelectionRect(rect);

    const startOffset = getGlobalOffset(
      container,
      range.startContainer,
      range.startOffset,
    );
    const endOffset = getGlobalOffset(
      container,
      range.endContainer,
      range.endOffset,
    );

    setSelection({
      text: selectionObj.toString(),
      startOffset,
      endOffset,
    });

    setNoteInput('');
    setShowNoteEditor(false);
    updateSelectionRect(rect);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (!selectedHighlightId || isProtectingSelection) return;

      // Kiểm tra nếu click vào modal note editor - KHÔNG clear selectedHighlightId
      const modalElements = document.querySelectorAll(
        '.ant-modal, .ant-modal-content, .ant-modal-body',
      );
      for (let modal of modalElements) {
        if (modal.contains(target)) return; // ← Sửa lỗi ở đây
      }

      // Kiểm tra các element con của modal
      const isInModal =
        target.closest('.ant-modal') ||
        target.closest('.ant-modal-content') ||
        target.closest('.ant-modal-body');
      if (isInModal) return;

      const popoverElements = document.querySelectorAll(
        '.ant-popover.highlight-popover',
      );

      for (let popover of popoverElements) {
        if (popover.contains(target)) return;
      }
      // Kiểm tra nếu click vào button hoặc icon trong popover
      const isButtonOrIcon =
        target.closest('button') ||
        target.closest('svg') ||
        target.closest('[role="button"]');
      if (isButtonOrIcon) {
        const parentPopover = isButtonOrIcon.closest('.ant-popover');
        if (
          parentPopover &&
          parentPopover.classList.contains('highlight-popover')
        ) {
          return; // Không clear nếu click vào button/icon trong highlight popover
        }
      }

      const highlightElement = target.closest(
        'mark[data-id], span.highlighted[data-id]',
      );
      if (
        highlightElement &&
        (highlightElement.getAttribute('data-id') === selectedHighlightId ||
          highlightElement.getAttribute('data-timestamp') ===
            selectedHighlightId)
      )
        return;

      // CHỈ clear selectedHighlightId nếu KHÔNG phải đang trong quá trình edit note
      if (!showNoteEditor) {
        setSelectedHighlightId(null);
        setHighlightRect(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [selectedHighlightId, showNoteEditor, isProtectingSelection]);

  // Handle click outside for text selection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (!selection) return;

      // Check if clicked inside the highlight popover
      const popoverElement = document.querySelector(
        '.ant-popover.highlight-popover',
      );
      if (popoverElement && popoverElement.contains(target)) return;

      // Check if clicked inside the container
      const container = containerRef.current;
      if (container && container.contains(target)) {
        // If clicking inside container, let the normal mouseUp handler deal with it
        return;
      }

      // Clicked outside container, clear selection
      setSelection(null);
      setSelectionRect(null);

      // Clear browser selection as well
      const browserSelection = window.getSelection();
      if (browserSelection) {
        browserSelection.removeAllRanges();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selection]);

  // Handle highlight click - Updated to work with both custom and package highlights
  // Updated handleHighlightClick to work with span.highlighted elements instead of mark elements
  const handleHighlightClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Look for span elements with class 'highlighted' instead of mark elements
    let highlightSpan = null;

    // Method 1: Check if clicked element is the highlight span
    if (target.classList.contains('highlighted')) {
      highlightSpan = target;
    }

    // Method 2: Look for highlighted span in parent chain
    if (!highlightSpan) {
      highlightSpan = target.closest('span.highlighted');
    }

    if (!highlightSpan) {
      setSelectedHighlightId(null);
      setHighlightRect(null);
      return;
    }

    // Prevent event from bubbling
    e.stopPropagation();

    const rect = highlightSpan.getBoundingClientRect();

    // Use timestamp as ID or create new one
    let id =
      highlightSpan.getAttribute('data-timestamp') ||
      highlightSpan.getAttribute('data-id');

    if (!id) {
      id = `highlight-${Date.now()}`;
      highlightSpan.setAttribute('data-id', id);
    }

    setSelectedHighlightId(id);
    setHighlightRect(rect);
  };

  // Updated handleRemoveHighlight to work with span elements
  const handleRemoveHighlight = () => {
    if (!selectedHighlightId) return;

    const container = containerRef.current;
    if (!container) return;

    // Look for span with matching data-id or data-timestamp
    let highlightElement =
      container.querySelector(
        `span.highlighted[data-id="${selectedHighlightId}"]`,
      ) ||
      container.querySelector(
        `span.highlighted[data-timestamp="${selectedHighlightId}"]`,
      );

    if (highlightElement) {
      const parent = highlightElement.parentNode;
      if (parent) {
        const textContent = highlightElement.textContent || '';
        parent.replaceChild(
          document.createTextNode(textContent),
          highlightElement,
        );
        // Normalize text nodes
        parent.normalize();
      }
    }

    // Remove from state (match by ID or timestamp)
    const updatedHighlights = highlights.filter(
      (hl) =>
        hl.id !== selectedHighlightId &&
        hl.id !== selectedHighlightId.replace('highlight-', ''), // Handle ID variations
    );
    setHighlights(updatedHighlights);
    setSelectedHighlightId(null);
    setHighlightRect(null);
  };

  const highlightElementById = (id: string): HTMLElement | null => {
    const container = containerRef.current;
    if (!container) return null;

    return (container.querySelector(`span.highlighted[data-id="${id}"]`) ||
      container.querySelector(
        `span.highlighted[data-timestamp="${id}"]`,
      )) as HTMLElement | null;
  };

  const applyHighlightEffect = (el: HTMLElement) => {
    el.style.transition = 'all 0.3s ease';
    el.style.boxShadow = '0 0 10px #60A5FA';
    el.style.transform = 'scale(1.02)';
  };

  const clearHighlightEffect = (el: HTMLElement) => {
    el.style.boxShadow = '';
    el.style.transform = '';
  };

  // Updated scrollToHighlight to work with span elements
  const scrollToHighlight = (id: string) => {
    const container = containerRef.current;
    if (!container) return;

    // Try multiple selectors to find the highlight
    let highlightElement = highlightElementById(id);

    // If still not found, try to match by text content
    if (!highlightElement) {
      const highlight = highlights.find((h) => h.id === id);
      if (highlight) {
        const allHighlights = container.querySelectorAll('span.highlighted');
        highlightElement = Array.from(allHighlights).find(
          (el) => el.textContent?.trim() === highlight.text.trim(),
        ) as HTMLElement;
      }
    }
    if (!highlightElement) return;

    highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Visual effect
    applyHighlightEffect(highlightElement);
    setTimeout(() => {
      clearHighlightEffect(highlightElement);
    }, 1500);

    setOpen(false);
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    id: string,
  ) => {
    const el = highlightElementById(id);
    if (!el) return;

    // Clear timeout nếu đang chờ remove highlight
    const timer = highlightTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      highlightTimers.current.delete(id);
    }

    applyHighlightEffect(el);
  };

  const handleMouseLeave = (id: string) => {
    const el = highlightElementById(id);
    if (!el) return;

    // Đặt timeout để gỡ hiệu ứng sau 2 giây
    const timeout = setTimeout(() => {
      clearHighlightEffect(el);
      highlightTimers.current.delete(id);
    }, 500);

    highlightTimers.current.set(id, timeout);
  };

  // Updated handleConfirmHighlight to properly track the created highlights
  const handleConfirmHighlight = () => {
    if (!selection) return;

    const domEle = containerRef.current;
    if (!domEle) return;

    // Use doHighlight from package
    const options: optionsImpl = {};
    const highlightMade = doHighlight(domEle, false, options);

    if (highlightMade) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Find the newly created highlight spans
        const newHighlightSpans = domEle.querySelectorAll(
          'span.highlighted:not([data-tracked])',
        );

        newHighlightSpans.forEach((span) => {
          // Mark as tracked to avoid duplicate processing
          span.setAttribute('data-tracked', 'true');

          // Get or create ID
          let id =
            span.getAttribute('data-timestamp') || span.getAttribute('data-id');

          if (!id) {
            id = `highlight-${Date.now()}`;
            span.setAttribute('data-id', id);
          }

          // Create highlight item to track
          const newHighlight: HighlightItem = {
            id: id,
            text: span.textContent || selection.text,
            note: noteInput,
            noteTime: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
            startOffset: selection.startOffset,
            endOffset: selection.endOffset,
          };

          setHighlights((prev) => [...prev, newHighlight]);
        });
      }, 10);
    }

    setSelection(null);
    setSelectionRect(null);
    setNoteInput('');
    setShowNoteEditor(false);
  };

  // Add CSS to make highlight spans clickable
  useEffect(() => {
    if (!containerRef.current) return;

    const style = document.createElement('style');
    style.textContent = `
    span.highlighted {
      cursor: pointer !important;
      pointer-events: auto !important;
    }
    span.highlighted:hover {
      opacity: 0.8;
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const timers = highlightTimers.current; // copy current ref

    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const saveNote = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedHighlightId) return;
    setHighlights((prev) =>
      prev.map((h) =>
        h.id === selectedHighlightId
          ? {
              ...h,
              note: noteInput,
              noteTime: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
            }
          : h,
      ),
    );
    setHighlightRect(null);
    setSelectedHighlightId(null);
    setNoteInput('');
    setShowNoteEditor(false);
    setModalPosition(null);
  };

  // Function để mở note editor và load existing note
  const openNoteEditor = (e?: React.MouseEvent) => {
    // Prevent event bubbling để tránh trigger handleClickOutside
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedHighlightId) return;

    // Bảo vệ selection trong một khoảng thời gian ngắn
    setIsProtectingSelection(true);
    setTimeout(() => setIsProtectingSelection(false), 100);

    // Load existing note nếu có
    const existingHighlight = highlights.find(
      (h) => h.id === selectedHighlightId,
    );
    if (existingHighlight && existingHighlight.note) {
      setNoteInput(existingHighlight.note);
    }
    // Tính toán vị trí modal dựa trên highlightRect
    if (highlightRect) {
      const modalWidth = 400; // Ước tính width của modal
      const modalHeight = 200; // Ước tính height của modal
      const padding = 20;

      let top =
        highlightRect.top + window.scrollY + highlightRect.height + padding;
      let left = highlightRect.left + window.scrollX;

      // Kiểm tra boundary để modal không bị ra ngoài viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Điều chỉnh left nếu modal bị tràn bên phải
      if (left + modalWidth > viewportWidth - padding) {
        left = viewportWidth - modalWidth - padding;
      }

      // Điều chỉnh left nếu modal bị tràn bên trái
      if (left < padding) {
        left = padding;
      }

      // Điều chỉnh top nếu modal bị tràn xuống dưới
      if (top + modalHeight > viewportHeight + window.scrollY - padding) {
        // Hiển thị modal phía trên text thay vì phía dưới
        top = highlightRect.top + window.scrollY - modalHeight - padding;
      }

      // Điều chỉnh top nếu modal bị tràn lên trên
      if (top < window.scrollY + padding) {
        top = window.scrollY + padding;
      }

      setModalPosition({ top, left });
    }
    setShowNoteEditor(true);
    setHighlightRect(null);
  };
  const onCancelAddNote = () => {
    setShowNoteEditor(false);
    setNoteInput('');
    setModalPosition(null);
    // Không clear selectedHighlightId khi cancel
  };
  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const calcdimensions = (width: number) => {
    if (width > 900) {
      return width / 2 + 330;
    }
    return width / 2 - 65;
  };
  return (
    <div
      onMouseUp={handleMouseUp}
      style={{ position: 'relative' }}
      onClick={handleHighlightClick}
    >
      {!selectedHighlightId && selection && selectionRect && (
        <Popover
          classNames={{
            root: 'highlight-popover',
          }}
          content={
            <Button
              onClick={handleConfirmHighlight}
              type="text"
              className="!px-2 py-1 text-white hover:!text-white"
              icon={<PointerIcon />}
            >
              Highlight this
            </Button>
          }
          open={true}
          trigger={[]}
          placement="bottom"
          overlayStyle={{
            position: 'absolute',
            top: selectionRect.top + window.scrollY + 28,
            left:
              selectionRect.left +
              window.scrollX +
              calcdimensions(selectionRect.width),
            zIndex: 9999,
          }}
        >
          <span />
        </Popover>
      )}

      {selectedHighlightId && highlightRect && (
        <Popover
          classNames={{
            root: 'highlight-popover',
          }}
          content={
            <>
              {isShowNote ? (
                <div
                  className="flex items-center justify-end gap-2"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Button
                    className=" !px-2 py-1 text-white hover:!text-white"
                    onClick={openNoteEditor}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="text"
                  >
                    <ShowCommentIcon /> Comment
                  </Button>
                  <div>
                    <Divider type="vertical" className="bg-white" />
                  </div>
                  <Button
                    onClick={handleRemoveHighlight}
                    type="text"
                    className=" !px-2 py-1 text-white hover:!text-white"
                    icon={<PointerIcon />}
                  >
                    Unhighlight this
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleRemoveHighlight}
                  type="text"
                  className="!px-2 py-1 text-white hover:!text-white"
                  icon={<PointerIcon />}
                >
                  Unhighlight this
                </Button>
              )}
            </>
          }
          overlayStyle={{
            position: 'absolute',
            top: highlightRect.top + window.scrollY + 28,
            left:
              highlightRect.left +
              window.scrollX +
              calcdimensions(highlightRect.width),
            zIndex: 9999,
          }}
          open={true}
          trigger={[]}
          placement="bottom"
        >
          <span />
        </Popover>
      )}

      {showNoteEditor && isShowNote && (
        <Modal
          open={showNoteEditor && isShowNote}
          onCancel={onCancelAddNote}
          footer={null}
          // Thêm các props này để tránh auto close
          maskClosable={false}
          keyboard={false}
          mask={false}
          style={{
            position: 'absolute',
            top: modalPosition?.top || 'auto',
            right: 50,
            margin: 0, // Remove default margin
            transform: 'none', // Remove default transform
          }}
          width={300}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <AvatarCard className="mb-3" user={user} />
            <TextArea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              rows={4}
              placeholder="Enter note"
            />
            <div className="mt-3 flex justify-end space-x-2">
              <ButtonSecondary
                onClick={onCancelAddNote}
                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              >
                Cancel
              </ButtonSecondary>
              <ButtonPrimary
                onClick={saveNote}
                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                type="primary"
              >
                Save
              </ButtonPrimary>
            </div>
          </div>
        </Modal>
      )}

      <div
        className={clsx(
          'fixed bottom-5 right-4 z-50 flex h-14 w-10 items-center justify-center rounded-full bg-white shadow-learning-activity',
          {
            hidden: !isShowNote,
          },
        )}
      >
        <span onClick={showDrawer} className="cursor-pointer">
          <ShowCommentIcon className="h-8 w-8" />
        </span>
      </div>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            {' '}
            <ShowCommentIcon /> Comment
          </div>
        }
        onClose={onClose}
        open={open}
        classNames={{
          header: 'highlight-drawer-header',
        }}
        mask={false}
      >
        <List
          className="px-6 py-4"
          dataSource={highlights}
          renderItem={(item) => (
            <List.Item
              className="hover:text-blue-600 w-full cursor-pointer"
              onClick={() => scrollToHighlight(item.id)}
              onMouseEnter={(e) => handleMouseEnter(e, item.id)}
              onMouseLeave={() => handleMouseLeave(item.id)}
            >
              <div className="w-full">
                <AvatarCard
                  className="mb-2"
                  description={calculateTimeAgo(item.noteTime)}
                  isShowType={false}
                  user={user}
                />
                <div className="border-blue-500 ml-5 border-l-2 pl-5">
                  <div className="mb-3 rounded-lg bg-white px-4 py-3 font-medium shadow-card">
                    {item.text}
                  </div>
                  {isShowNote && item.note && (
                    <div className="text-gray-500 text-xs">{item.note}</div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Drawer>

      <div
        id={storageKey}
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

function getGlobalOffset(
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

export default HighlightableHTML;
