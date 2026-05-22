type FindUserByUsername = (username: string) => Promise<{ id: string } | null>;

export async function generateUniqueUsername(
  fullName: string,
  findUserByUsername: FindUserByUsername,
): Promise<string> {
  const baseUsername = fullName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  const cleanBase = baseUsername || "user";

  let username = cleanBase;

  const existingUser = await findUserByUsername(username);

  if (!existingUser) {
    return username;
  }

  let isTaken = true;

  while (isTaken) {
    const randomNumber = Math.floor(100 + Math.random() * 9000);

    username = `${cleanBase}${randomNumber}`;

    const userExists = await findUserByUsername(username);

    if (!userExists) {
      isTaken = false;
    }
  }

  return username;
}
