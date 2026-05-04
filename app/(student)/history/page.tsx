import { connection } from "next/server";

import { AttemptHistoryList } from "@/components/history/AttemptHistoryList";
import { getCurrentUser } from "@/src/auth/current-user";
import { prisma } from "@/src/db/prisma";
import { listStudentAttemptHistory } from "@/src/history/student-history.service";
import { isDemoStudentFallbackEnabled, listDemoStudentAttemptHistory } from "@/src/student-demo/demo-store";
import type { StudentHistoryItemView } from "@/src/student-api/types";

async function loadHistory(): Promise<{ history: StudentHistoryItemView[]; usingDemoFallback: boolean }> {
  const currentUser = await getCurrentUser();

  try {
    const history = await listStudentAttemptHistory(prisma, currentUser) as unknown as StudentHistoryItemView[];

    return { history, usingDemoFallback: false };
  } catch (error) {
    if (!isDemoStudentFallbackEnabled()) {
      throw error;
    }

    return { ...listDemoStudentAttemptHistory(currentUser), usingDemoFallback: true } as unknown as { history: StudentHistoryItemView[]; usingDemoFallback: boolean };
  }
}

export default async function StudentHistoryPage() {
  await connection();
  const { history, usingDemoFallback } = await loadHistory();

  return (
    <div className="grid gap-6">
      <section className="rounded-[2.5rem] bg-[color:var(--tem-ink)] p-8 text-[color:var(--tem-paper)] shadow-[0_30px_100px_rgba(42,31,20,0.22)] sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--tem-gold)]">Student record</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] sm:text-6xl">Attempt archive</h1>
        <p className="mt-4 max-w-2xl text-[color:var(--tem-paper)]/72">
          Submitted time, duration, and score state stay attached to each archived practice session.
        </p>
        {usingDemoFallback ? <p className="mt-4 text-sm text-[color:var(--tem-paper)]/62">Development demo data is active.</p> : null}
      </section>
      <AttemptHistoryList attempts={history} />
    </div>
  );
}
