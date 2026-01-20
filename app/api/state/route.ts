import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export async function GET() {
  const [collaborators, projects, activities] = await Promise.all([
    supabaseAdmin.from("collaborators").select("*").order("created_at"),
    supabaseAdmin.from("projects").select("*").order("created_at"),
    supabaseAdmin.from("activities").select("*").order("created_at")
  ]);

  if (collaborators.error) {
    return Response.json({ error: collaborators.error.message }, { status: 500 });
  }
  if (projects.error) {
    return Response.json({ error: projects.error.message }, { status: 500 });
  }
  if (activities.error) {
    return Response.json({ error: activities.error.message }, { status: 500 });
  }

  return Response.json({
    collaborators: collaborators.data,
    projects: projects.data,
    activities: activities.data
  });
}
