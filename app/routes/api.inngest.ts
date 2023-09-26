// app/routes/api.inngest.ts
import { serve } from "inngest/remix";
import { inngest } from "../../inngest/client";
import { multistep } from "../../inngest/functions";

const handler = serve(inngest, [multistep]);

export { handler as loader, handler as action };
