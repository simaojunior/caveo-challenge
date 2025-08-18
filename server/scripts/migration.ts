import { AppDataSource } from '../src/infra/repos/postgres/helpers/data-source';
export const Command = {
  RUN: 'run',
  REVERT: 'revert',
} as const;

export type Command = (typeof Command)[keyof typeof Command]

async function run() {
  await AppDataSource.initialize();

  const command: Command = process.argv[2] as Command;

  const runCommand = {
    [Command.RUN]: async () => {
      await AppDataSource.runMigrations();
    },
    [Command.REVERT]: async () => {
      await AppDataSource.undoLastMigration();
    },
  };

  await runCommand[command]();

  await AppDataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
