export interface PageTreeNode {
  id: string;
  tag: string;
  title: string;
  depth: number;
  children: PageTreeNode[];
}

export interface PageRow {
  id: string;
  tag: string;
  title: string;
  parent_id: string | null;
  depth: number;
}

export function buildPageTree(pages: PageRow[]): PageTreeNode[] {
  const nodes = new Map<string, PageTreeNode>();
  pages.forEach((p) => nodes.set(p.id, { id: p.id, tag: p.tag, title: p.title, depth: p.depth, children: [] }));

  const roots: PageTreeNode[] = [];
  pages.forEach((p) => {
    const node = nodes.get(p.id)!;
    const parent = p.parent_id ? nodes.get(p.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const byTitle = (a: PageTreeNode, b: PageTreeNode) => a.title.localeCompare(b.title);
  function sortTree(list: PageTreeNode[]) {
    list.sort(byTitle);
    list.forEach((n) => sortTree(n.children));
  }
  sortTree(roots);

  return roots;
}
