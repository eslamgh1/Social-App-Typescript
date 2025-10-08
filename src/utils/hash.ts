import { hash, compare } from "bcrypt";
//The hash and compare functions from the bcrypt package in Node.js are asynchronous by default
export const Hash =  async (plainText: string, saltRounds: number=Number(process.env.SALT_ROUNDS)) => {
  return  hash(plainText, saltRounds)

};
export const Compare =  async (plainText: string, cipherText:string) => {
  return  compare(plainText, cipherText)

};