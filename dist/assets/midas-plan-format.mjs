// Shared by the static export and browser download so both retain the same scope and evidence.
export function dateAt(start,days){
 const date=new Date(`${start}T12:00:00Z`);
 date.setUTCDate(date.getUTCDate()+days);
 return date.toISOString().slice(0,10);
}

export function formatPlanMarkdown(plan,start){
 const schedule=plan.weeks.map(w=>`### ${w.id} · ${dateAt(start,w.offset*7)}–${dateAt(start,w.offset*7+6)} · ${w.title}\n\n- 주작업: ${w.focus}\n- 결과물: ${w.output}\n- 다음 단계 조건: ${w.checkpoint}\n- 지연 시: ${w.fallback}\n- 연결 작업: ${w.tasks.join(', ')}\n`).join('\n');
 const tasks=plan.tasks.map(t=>`- ${t.state==='done'?'[x]':'[ ]'} ${t.id} [${plan.states[t.state].label}] ${t.title}\n  - 결과/완료 조건: ${t.done||t.result}\n  - ${t.boundary?`확인 범위: ${t.boundary}`:`선행 조건: ${t.dependency}`}\n${t.date?`  - 완료 기록일: ${t.date}\n`:''}${t.checks?.length?`  - 세부 확인:\n${t.checks.map(c=>`    - ${c}\n`).join('')}`:''}  - 근거: ${t.evidence.join(', ')||'새 결과가 필요한 제안'}\n`).join('\n');
 const research=plan.research.map(r=>`- [ ] ${r.id} [${r.stage}] ${r.title}\n  - 내용: ${r.description}\n  - 완료 조건: ${r.done}\n  - 경계: ${r.boundary}\n`).join('\n');
 return `# MIDAS — 제안 일정과 작업 목록\n\n정리: ${plan.asOf} · 실험 기록 기준: ${plan.evidenceAsOf}\n시작일 가정: ${start} · 확정 일정 아님\n날짜를 바꾸어도 완료 상태와 과거 근거는 바뀌지 않습니다.\n\n## 첫 6주\n\n${schedule}\n## 제품·공개 준비 작업 목록\n\n${tasks}\n## 별도 연구 트랙 — 2026-10-24 설계\n\n제품 6주 계획에 연구 실험 소요 시간을 배정하지 않았습니다. 병행 시 주목표와 가용 시간을 먼저 조정합니다.\n\n${research}\nH1 결과에 따라 H2(파지 변화) 또는 H3(동작·가림)를 선택합니다. 실제 도구 정확도 시험은 미실행입니다.\n\n## 운영\n\n매주: 확인한 결과 / 막힌 점 / 다음 1–3개 작업\n매월: 목표 변화 / 대표 증거 / 다음 마일스톤\n\n공개는 별도 검토 후 결정. 체크는 기록된 좁은 완료 범위를 뜻하며 제품 전체의 검증 완료가 아닙니다.\n`;
}
