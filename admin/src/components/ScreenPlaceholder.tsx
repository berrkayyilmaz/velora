type ScreenPlaceholderProps = {
  title: string;
};

export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  );
}
