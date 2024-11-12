import CollaborativeRoom from "@/components/CollaborativeRoom";
import Loader from "@/components/Loader";
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
interface DocumentProps {
  params: {
    id: string;
  };
}

const Document = async ({ params: { id } }: DocumentProps) => {
 const clerkUser = await currentUser();

 if (!clerkUser) redirect("/sign-in");

 const room = await getDocument({
   roomId: id,
   userId: clerkUser.emailAddresses[0].emailAddress,
 }).catch((error) => {
   console.error("Error fetching document:", error);
   redirect("/");
 });

 if (!room) redirect("/");

 const userIds = Object.keys(room.usersAccesses);
 const users = await getClerkUsers({ userIds }).catch((error) => {
   console.error("Error fetching users:", error);
   return [];
 });

 const PERMISSIONS = {
   WRITE: "room:write",
 } as const;

 const usersData = users.map((user: User) => ({
   ...user,
   userType: room.usersAccesses[user.email]?.includes(PERMISSIONS.WRITE)
     ? "editor"
     : "viewer",
 }));

  const currentUserType = room.usersAccesses[
    clerkUser.emailAddresses[0].emailAddress
  ]?.includes("room:write")
    ? "editor"
    : "viewer";

  return (
    <main className="flex w-full flex-col items-center">
      <Suspense fallback={<Loader />}>
        <CollaborativeRoom
          roomId={id}
          roomMetadata={room.metadata}
          users={usersData}
          currentUserType={currentUserType}
        />
      </Suspense>
    </main>
  );
};

export default Document;
