/**
 * DNS classes
 * @packageDocumentation
 */

/**
 * DNS Classes as defined in RFC1035
 * @remarks https://www.ietf.org/rfc/rfc1035.txt
 */
export enum Classes {
  IN = 1, // the Internet
  CS, // the CSNET class (Obsolete - used only for examples in some obsolete RFCs)
  CH, // the CHAOS class
  HS, // Hesiod [Dyer 87]
}
