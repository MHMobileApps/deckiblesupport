declare module 'bcryptjs' {
  export function compare(s: string, hash: string): Promise<boolean>;

  const bcrypt: {
    compare: typeof compare;
  };

  export default bcrypt;
}
