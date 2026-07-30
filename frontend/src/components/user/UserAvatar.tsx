import { useAuth } from "../../context/AuthContext";

interface UserAvatarProps {
  size?: number;
}

export default function UserAvatar({
  size = 40,
}: UserAvatarProps) {
  const { user } = useAuth();

  const initials =
    user?.fullName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() ?? "?";

  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.fullName}
        className="rounded-full object-cover"
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-cyan-500 font-bold text-slate-950"
      style={{
        width: size,
        height: size,
      }}
    >
      {initials}
    </div>
  );
}


