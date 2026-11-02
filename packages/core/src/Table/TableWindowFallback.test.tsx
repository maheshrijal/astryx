// Copyright (c) Meta Platforms, Inc. and affiliates.
/** Development fallback diagnostics through the public Table windowing surface. */
import {render, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {Table} from './Table';
import {useTableVirtualization} from './plugins/virtualization/useTableVirtualization';
import type {TableColumn, TablePlugin} from './types';
interface Item extends Record<string, unknown> {
  id: string;
  name: string;
}
const data: Item[] = Array.from({length: 50}, (_, i) => ({
  id: String(i),
  name: `Item ${i}`,
}));
const columns: TableColumn<Item>[] = [{key: 'name', header: 'Name'}];
const bodyModifier: TablePlugin<Item> = {transformBodyRow: props => props};
function Fixture({reason}: {reason: string}) {
  const virtualization = useTableVirtualization({
    rowHeight: reason === 'geometry' ? 0 : 56,
    viewportHeight: 240,
  });
  return (
    <Table
      data={data}
      columns={
        reason === 'renderer'
          ? [{key: 'name', header: 'Name', renderCell: item => item.name}]
          : columns
      }
      idKey="id"
      virtualization={virtualization}
      textOverflow={reason === 'wrap' ? 'wrap' : undefined}
      rowIndexStart={reason === 'offset' ? 2 : undefined}
      rowCount={reason === 'count' ? 500 : undefined}
      plugins={reason === 'model' ? {modifier: bodyModifier} : undefined}
    />
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('Table windowing admission diagnostics', () => {
  it.each(['renderer', 'wrap', 'offset', 'count', 'model', 'geometry'])(
    'explains %s full-render fallback once across rerenders',
    reason => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const view = render(<Fixture reason={reason} />);
      expect(view.container.querySelectorAll('tbody>tr')).toHaveLength(50);
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning.mock.calls[0].join(' ')).toContain('Windowing disabled:');
      view.rerender(<Fixture reason={reason} />);
      expect(warning).toHaveBeenCalledTimes(1);
    },
  );
  it('reports invalid identity once without a duplicate error for the same fallback', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const duplicateData = [
      {id: 'a', name: 'A'},
      {id: 'a', name: 'B'},
    ];
    function DuplicateFixture() {
      const virtualization = useTableVirtualization({
        rowHeight: 56,
        viewportHeight: 240,
      });
      return (
        <Table
          data={duplicateData}
          columns={columns}
          idKey="id"
          virtualization={virtualization}
        />
      );
    }
    const view = render(<DuplicateFixture />);
    view.rerender(<DuplicateFixture />);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0].join(' ')).toContain(
      'explicit unique valid row identity',
    );
    expect(error).not.toHaveBeenCalled();
    expect(view.container.querySelectorAll('tbody > tr')).toHaveLength(2);
  });
  it('keeps each fallback reason observable once across reason changes', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(<Fixture reason="wrap" />);
    view.rerender(<Fixture reason="renderer" />);
    view.rerender(<Fixture reason="wrap" />);
    expect(warning).toHaveBeenCalledTimes(2);
  });
  it('does not warn for valid bounded windowing', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Fixture reason="none" />);
    expect(warning).not.toHaveBeenCalled();
  });
});
