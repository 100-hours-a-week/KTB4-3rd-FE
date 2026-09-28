declare module '@microsoft/clarity' {
  type Clarity = {
    init: (projectId: string) => void;
  };

  const clarity: Clarity;

  export default clarity;
}
