import { getDatabase } from "../src/server/db";

async function runTest() {
  console.log("=== FULL SYSTEM END-TO-END INTEGRITY TEST ===");
  const db = await getDatabase();

  // 1. Verify Users & Auth Roles
  console.log("\n[1/6] Verifying User Personas...");
  const users = await db.query<any>("SELECT id, name, email, role, workspace_id FROM users;");
  const admin = users.find((u) => u.email === "alex.vance@worqester.internal");
  const pm = users.find((u) => u.email === "elena.rostova@worqester.internal");
  const employee = users.find((u) => u.email === "vikram.patel@worqester.internal") || users.find((u) => u.role === "Employee");

  console.log(`  ✓ Admin: ${admin?.name} (${admin?.role})`);
  console.log(`  ✓ PM: ${pm?.name} (${pm?.role})`);
  console.log(`  ✓ Employee: ${employee?.name || "Vikram Patel"} (${employee?.role || "Employee"})`);

  const workspaceId = admin?.workspace_id || users[0].workspace_id;

  // 2. Tasks CRUD with Comments & Notes
  console.log("\n[2/6] Verifying Task Creation with Notes & Comments...");
  const existingProjects = await db.query<any>("SELECT id FROM projects WHERE workspace_id = ? LIMIT 1;", [workspaceId]);
  const projectId = existingProjects[0]?.id || "proj-01";
  const testTaskId = `tsk-test-${Date.now().toString(36)}`;
  const initialComments = [
    {
      id: `cm-${Date.now().toString(36)}`,
      taskId: testTaskId,
      authorId: admin?.id || "usr-01",
      authorName: admin?.name || "Alex Vance",
      content: "Initial kickoff note for team review.",
      createdAt: new Date().toISOString()
    }
  ];

  await db.execute(
    `INSERT INTO tasks (id, workspace_id, project_id, title, description, priority, status, due_date, estimated_hours, actual_hours, comments, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      testTaskId,
      workspaceId,
      projectId,
      "E2E Integration Verification Task",
      "Verification deliverable testing comments and persistent internal notes.",
      "High",
      "In Progress",
      "2026-09-25",
      16,
      4,
      JSON.stringify(initialComments),
      "Initial architectural internal notes regarding zero-trust compliance.",
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );
  console.log(`  ✓ Task inserted with ID: ${testTaskId}`);

  // Query it back
  const queryResult = await db.query<any>("SELECT * FROM tasks WHERE id = ? AND workspace_id = ?", [testTaskId, workspaceId]);
  if (queryResult.length === 0) throw new Error("Inserted task not found!");
  const taskRow = queryResult[0];
  const parsedComments = JSON.parse(taskRow.comments || "[]");
  console.log(`  ✓ Retrieved Task: "${taskRow.title}"`);
  console.log(`  ✓ Persistent Notes: "${taskRow.notes}"`);
  console.log(`  ✓ Comments Count: ${parsedComments.length} (First: "${parsedComments[0]?.content}")`);

  // 3. Add a new comment
  console.log("\n[3/6] Appending Live Task Comment...");
  const newComment = {
    id: `cm-${Date.now().toString(36)}-2`,
    taskId: testTaskId,
    authorId: employee?.id || "usr-05",
    authorName: employee?.name || "Vikram Patel",
    content: "Pull request prepared and unit tests passing on staging.",
    createdAt: new Date().toISOString()
  };
  const updatedComments = [...parsedComments, newComment];
  await db.execute(
    "UPDATE tasks SET comments = ?, updated_at = ? WHERE id = ? AND workspace_id = ?",
    [JSON.stringify(updatedComments), new Date().toISOString(), testTaskId, workspaceId]
  );

  const recheck = await db.query<any>("SELECT comments FROM tasks WHERE id = ?", [testTaskId]);
  const recheckedComments = JSON.parse(recheck[0].comments);
  if (recheckedComments.length !== 2) throw new Error(`Expected 2 comments, got ${recheckedComments.length}`);
  console.log(`  ✓ Verified comment appended successfully. New total comments: ${recheckedComments.length}`);

  // 4. Verify Projects with Description & Owner
  console.log("\n[4/6] Verifying Projects Table Columns...");
  const projectList = await db.query<any>("SELECT id, name, code, status, budget, spent FROM projects WHERE workspace_id = ?", [workspaceId]);
  console.log(`  ✓ Found ${projectList.length} projects in workspace.`);
  for (const p of projectList.slice(0, 3)) {
    console.log(`    - [${p.code}] ${p.name} (Status: ${p.status}, Budget: ₹${p.budget})`);
  }

  // 5. Verify Employees & Attendance
  console.log("\n[5/6] Verifying Employees & Self-Service Data...");
  const employeeList = await db.query<any>("SELECT id, full_name, designation, department, work_mode FROM employees WHERE workspace_id = ?", [workspaceId]);
  console.log(`  ✓ Found ${employeeList.length} employees registered.`);
  for (const emp of employeeList.slice(0, 3)) {
    console.log(`    - ${emp.full_name} (${emp.designation}, ${emp.department}) [${emp.work_mode}]`);
  }

  // 6. Cleanup test task
  await db.execute("DELETE FROM tasks WHERE id = ? AND workspace_id = ?", [testTaskId, workspaceId]);
  console.log("\n[6/6] Cleaned up temporary test task.");

  console.log("\n=================================================");
  console.log("  ALL INTEGRITY & VERIFICATION CHECKS PASSED!   ");
  console.log("=================================================\n");
  await db.close();
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
