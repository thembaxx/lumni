export function getRandomName(): string {
  const names = [
    "John",
    "Sarah",
    "Michael",
    "Emily",
    "David",
    "Sophia",
    "James",
    "Olivia",
    "Daniel",
    "Emma",
  ];

  const randomIndex = Math.floor(Math.random() * names.length);
  return names[randomIndex];
}
