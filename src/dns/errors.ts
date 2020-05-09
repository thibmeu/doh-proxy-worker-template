export enum Errors {
  NoError = 0,
  FormErr,
  ServFail,
  NXDomain,
  NotImp,
  Refused,
  YXDomain,
  YXRRSet,
  NXRRSet,
  NotAuth,
  NotZone,
  BADVERS = 16, // This is also BADSIG
  BADKEY,
  BADTIME,
  BADMODE,
  BADNAME,
  BADALG,
}
