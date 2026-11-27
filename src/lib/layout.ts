export interface Span {
  id: string;
  start: number;
  end: number;
}

export interface PlacedSpan extends Span {
  column: number;
  columns: number;
}

/** Assigns side-by-side columns to overlapping spans so that each block stays readable. */
export function layoutSpans(spans: Span[]): PlacedSpan[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const columnEnds: number[] = [];
  const columnOf = new Map<string, number>();

  for (const span of sorted) {
    let column = columnEnds.findIndex((end) => end <= span.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(span.end);
    } else {
      columnEnds[column] = span.end;
    }
    columnOf.set(span.id, column);
  }

  return sorted.map((span) => {
    const column = columnOf.get(span.id) ?? 0;
    let columns = column + 1;
    for (const other of sorted) {
      if (other.id === span.id) continue;
      if (other.start < span.end && span.start < other.end) {
        columns = Math.max(columns, (columnOf.get(other.id) ?? 0) + 1);
      }
    }
    return { ...span, column, columns };
  });
}
