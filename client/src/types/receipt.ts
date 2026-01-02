export type Align = 'left' | 'center' | 'right'
export type FontSize = 'sm' | 'md' | 'lg'
export type PaperWidth = '58mm' | '80mm'

export interface ShopNameBlock {
  type: 'shopName'
  align: Align
  size: FontSize
}

export interface ItemsBlock {
  type: 'items'
  showQty: boolean
  showPrice: boolean
}

export interface TextBlock {
  type: 'footer'
  text: string
  align: Align
}

export interface DividerBlock {
  type: 'divider'
}

export interface TotalBlock {
  type: 'grandTotal'
  emphasize: boolean
}

export type ReceiptBlock =
  | ShopNameBlock
  | ItemsBlock
  | TextBlock
  | DividerBlock
  | TotalBlock

export interface ReceiptLayout {
  width: PaperWidth
  fontSize: FontSize
  blocks: ReceiptBlock[]
}
