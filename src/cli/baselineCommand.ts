import { saveBaseline, loadBaseline, deleteBaseline, listBaselines, compareToBaseline } from '../diff/diffBaseline';
import { DiffEntry } from '../diff/diffCache';

export interface BaselineArgs {
  subcommand: 'save' | 'list' | 'delete' | 'compare';
  name?: string;
  entries?: DiffEntry[];
}

export function parseBaselineArgs(argv: string[]): BaselineArgs {
  const [subcommand, name] = argv;
  if (!['save', 'list', 'delete', 'compare'].includes(subcommand)) {
    throw new Error(`Unknown baseline subcommand: '${subcommand}'. Use save|list|delete|compare.`);
  }
  return { subcommand: subcommand as BaselineArgs['subcommand'], name };
}

export function runBaselineCommand(args: BaselineArgs, currentEntries?: DiffEntry[]): void {
  switch (args.subcommand) {
    case 'save': {
      if (!args.name) throw new Error('baseline save requires a name');
      if (!currentEntries) throw new Error('No entries to save');
      saveBaseline(args.name, currentEntries);
      console.log(`Baseline '${args.name}' saved with ${currentEntries.length} entries.`);
      break;
    }
    case 'list': {
      const names = listBaselines();
      if (names.length === 0) {
        console.log('No baselines saved.');
      } else {
        console.log('Saved baselines:');
        names.forEach(n => console.log(`  - ${n}`));
      }
      break;
    }
    case 'delete': {
      if (!args.name) throw new Error('baseline delete requires a name');
      const removed = deleteBaseline(args.name);
      console.log(removed ? `Baseline '${args.name}' deleted.` : `Baseline '${args.name}' not found.`);
      break;
    }
    case 'compare': {
      if (!args.name) throw new Error('baseline compare requires a name');
      if (!currentEntries) throw new Error('No current entries to compare');
      const { added, removed, unchanged } = compareToBaseline(args.name, currentEntries);
      console.log(`Compared to baseline '${args.name}':`);
      console.log(`  Added:     ${added.length}`);
      console.log(`  Removed:   ${removed.length}`);
      console.log(`  Unchanged: ${unchanged.length}`);
      added.forEach(e => console.log(`  + ${e.path} (${e.type})`));
      removed.forEach(e => console.log(`  - ${e.path} (${e.type})`));
      break;
    }
  }
}
