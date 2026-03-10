import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize HTML content voor veilige rendering met dangerouslySetInnerHTML.
 * Staat alleen veilige tags toe die nodig zijn voor geformatteerde berichten.
 */
const ALLOWED_TAGS = ["strong", "em", "p", "br", "ul", "ol", "li", "a", "span"]
const ALLOWED_ATTR = ["href", "target", "rel", "class"]

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}
