import fs from "node:fs";
import { readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

const COMMENT_MARKER_PATTERN = /\/\//g;

export const updateTrpcTs = () => {
  const { trpc } = getFilePaths();
  const filePath = formatFilePath(trpc.serverTrpc, {
    prefix: "rootPath",
    removeExtension: false,
  });
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const protectedProcedure = `\n\n/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
`;
  if (!fileContent.includes("export const protectedProcedure")) {
    fs.writeFileSync(filePath, fileContent.concat(protectedProcedure));
  }
};

export const enableSessionInContext = () => {
  const { trpc } = getFilePaths();
  const filePath = formatFilePath(trpc.trpcContext, {
    prefix: "rootPath",
    removeExtension: false,
  });
  const fileContent = fs.readFileSync(filePath, "utf-8");
  fs.writeFileSync(filePath, fileContent.replace(COMMENT_MARKER_PATTERN, ""));
};

export const updateTrpcWithSessionIfInstalled = () => {
  const { packages, t3 } = readConfigFile();
  if (packages.includes("trpc") && !t3) {
    updateTrpcTs();
    enableSessionInContext();
  }
};
