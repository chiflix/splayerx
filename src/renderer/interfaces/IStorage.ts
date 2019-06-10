export interface IStorage {
  get(key:String, json:any):Promise<boolean>
  set(key:String, json:any):Promise<boolean>
  clear():Promise<boolean>
}
