"use client";

import { use } from "react";
import ProfileView from "../../../components/profile/ProfileView";

export default function PublicUserProfile({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params Promise (Next.js 15+)
    const { id } = use(params);

    return <ProfileView userId={id} />;
}
