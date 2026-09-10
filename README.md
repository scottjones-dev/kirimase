<h1 align="center">
  GenNext
</h1>
<p align="center">
<img src="https://img.shields.io/npm/v/gennext?style=flat-square" alt="npm_version">
</p>

<p align="center">GenNext is a command-line tool for <strong>building full-stack Next.js apps faster</strong>. It supercharges your development workflow, allowing you to quickly integrate packages and scaffold resources for your application with best practices in mind.</p>

> GenNext is a maintained fork of [Kirimase](https://github.com/nicoalbanese/kirimase) by [Nico Albanese](https://github.com/nicoalbanese), continuing development after the original project went dormant. See [MIGRATION.md](MIGRATION.md) if you're coming from Kirimase.

## Features

1. **Initialization and Configuration**: quickly add and set up essential packages to jump-start your Next.js project.
2. **Code Generation**: scaffold models, views, and controllers directly from the CLI.

<br />

## Quick Start

Install GenNext CLI globally:

```bash
npm install -g gennext
```

<br />

If you don't already have a Nextjs app, run create-next-app with your preferred package manager.

Then run the following command within the directory of your project:

```bash
gennext init
```

Note: GenNext is not compatible with the the pages directory.

# Commands

Run these commands within the directory of your Nextjs app:

### 1. `gennext add`

Initializes and configures the following packages for your Next.js project, categorized into:

### ORM

#### Drizzle-ORM

- Based on your chosen database type (PostgreSQL, MySQL, SQLite), GenNext sets up the required files for [Drizzle-ORM](https://github.com/drizzle-team/drizzle-orm), [drizzle-zod](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-zod/README.md) for validations and and [drizzle-kit](https://github.com/drizzle-team/drizzle-kit-mirror) to manage migrations.
- Scripts are auto-added to `package.json` for immediate use of drizzle-kit.

#### Prisma

- GenNext sets up required files for [Prisma](https://github.com/prisma/prisma) with [zod-prisma](https://github.com/CarterGrimmeisen/zod-prisma) for validations.

---

### Authentication

#### Better Auth

- Generates email/password sign-in and sign-up, optional Apple, Discord, GitHub, and Google buttons, server sessions, route protection, sign-out, and profile-name updates.
- Configures the official Drizzle or Prisma adapter and runs the pinned Better Auth schema generator. GenNext prints the database migration command but never applies it.

#### Clerk

- Generates files for [Clerk](https://github.com/clerkinc/javascript) including all necessary config.
- Wraps the root layout with the auth provider and generates utilities for auth checks and redirects in your Next.js routes.

---

### Other

#### tRPC

- Generates files to configure [tRPC](https://github.com/trpc/trpc) with the app router.
- Provides client-side tRPC and scaffolds server-side configuration using the experimental server-invoker pattern.
- Wraps the root layout in the tRPC provider.

#### Shadcn-UI

- Installs and configures [Shadcn-UI](https://github.com/shadcn-ui/ui) including button and toast components.
- Inserts the toast-provider (`<Toaster />`) to the root layout for instant toast notifications in your Next.js app.

#### Stripe

- Installs and configures Stripe within your Next.js project so you can start accepting subscription payments.

#### Resend

- Installs and configures [Resend](https://resend.com/)

GenNext also adds relevant keys to your `.env` which you'll need to provide values for.

<br />

## 2. `gennext generate`

Akin to `rails scaffold` but for Next.js.

GenNext generates:

#### a) Model:

- Generates a drizzle schema with column types based on your SQL flavor and database provider.
- Uses drizzle-zod to generate Zod schemas for frontend and backend validation.
- Generates queries and mutations for CRUD operations, fully typed and optimized for consumption via a Next.js front-end.

#### b) Controller:

- Gives you an option to scaffold tRPC, Server Actions and/or API routes.
- Uses Zod schemas from models for request validation.
- Includes built-in error handling for API routes and auto-adding of tRPC routes to the root router.

#### c) Views:

- Scaffolds views using Shadcn-UI to enable immediate CRUD operations (including select fields for adding relations and datepickers for dates).
- Option to use either React Hook Form with tRPC or plain React (useOptimistic and useValidated Form hooks)

## Run in non-interactive mode

You can run `gennext init` and `gennext add` entirely via the command line as follows:

```sh
gennext init -sf yes -pm pnpm --orm prisma -db pg -a better-auth -ap github discord -mp trpc stripe resend -cl shadcn-ui -ie yes
```

| Command | Short Flag | Long Option       | Description                                    | Argument          |
| ------- | ---------- | ----------------- | ---------------------------------------------- | ----------------- |
| init    | -          | -                 | initialise and configure gennext               | -                 |
| -       | -h         | --headless        | initialise without any ui                      | `yes` or `no`     |
| -       | -sf        | --src-folder      | use a src folder                               | `yes` or `no`     |
| -       | -pm        | --package-manager | package manager                                | `<pm>`            |
| -       | -cl        | --component-lib   | component library                              | `<component-lib>` |
| -       | -o         | --orm             | orm                                            | `<orm>`           |
| -       | -db        | --db              | database ("pg", "mysql", "sqlite")             | `<db>`            |
| -       | -dbp       | --db-provider     | database provider - important if using drizzle | `<dbp>`           |
| -       | -a         | --auth            | auth                                           | `<auth>`          |
| -       | -ap        | --auth-providers  | social auth providers                          | `<providers>`     |
| -       | -mp        | --misc-packages   | packages ("trpc", "shadcn-ui", "resend")       | `<packages>`      |
| -       | -ie        | --include-example | include example                                | `yes` or `no`     |

## Contributing

Keen on enhancing GenNext? Contributions, bug reports, and feature requests are always welcome. Feel free to open an issue or submit a pull request.

To run locally:

```sh
pnpm i
pnpm run dev

npm install -g . (in a second terminal - this will then make gennext available across your machine using "gennext *command*")
```

## License

[MIT](LICENSE)
