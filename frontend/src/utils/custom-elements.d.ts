// to remove vpl-editor tsx error
declare namespace JSX {
  interface IntrinsicElements {
    'vpl-editor': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
  }
}
