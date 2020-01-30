export const trusted: string[] = [
  // nodes
  "0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95",
  "0xa0af2e71cecc248f4a7fd606f203467b500dd53b",
  "0x848920b14154b6508b8d98e7ee8159aa84b579a4",
  "0x00783f9375f8876a77a49b495608574cb8000d54",
  "0xe6e53b5fc2e18f51781f14a3ce5e7fd468247a15",
  "0x2ffe970257d93eae9d6b134f528b93b262c31030",
  "0xa42c9b0d1a30722aea8b81e72957134897e7a11a",
  "0x41a865269f5182ea69bfb0cfa1e8411c82ade941",
  "0xfdb8da92c3597e81c2737e8be793bee9f1172045",
  "0x42739cf822dc1ca343c20f36b20578d01b73f7d1",
  "0x802779bdccf04371a1ab53401eaa0c39c65810da",
  "0xd5ede46b41eb05bbb6e85bd5456ac2769e1c2f26",
  "0x1bb11dfb5cee9ea57f8e293320ac30d2b17622f0",
  "0x5123bd700be6f6990f7bbb8c435ef190d1b5a950",
  "0x825802c3381128a46e7483f81fc0739b48468db3",
  "0x494ceb6f25938068c43c7cb17f1bbb69ec2e74cc",
  "0x5e8eacdbbb8478f38a1eaf6a2631a3d26bcb2069",
  "0xe125bd73998916e76920ce6248029e4d2bffa9ce",
  "0x45bcde87050c0342da0bb8e953b087c424f3f77c",
  "0xe125bd73998916e76920ce6248029e4d2bffa9ce",
  "0x1a64aef421c46c26e07d28ffc06555a5c3c9606b",

  // proxy
  "0x141f636701664890d9a27a8f53aeb6118d97c658",
  "0xdfbc7739bf6c07365012719591fb1f6b2ceadd03",
  "0x006ee9e945e60a19e88edb44c63d94b874eb2e70",
  "0x6717429e6a1b4b26c67060240f6d1df0aab9df61"
]

export const banned: string[] = []

export const reserved: string[] = []

// add trusted from env
if (process.env.TRUSTED_ADDRESSES) {
  trusted.push(...process.env.TRUSTED_ADDRESSES.split(','))
}
if (process.env.BANNED_ADDRESSES) {
  banned.push(...process.env.BANNED_ADDRESSES.split(','))
}
if (process.env.RESERVED_ADDRESSES) {
  reserved.push(...process.env.RESERVED_ADDRESSES.split(','))
}

const compression = process.env.COMPRESSION ? process.env.COMPRESSION === 'true' : true
const production = process.env.NODE_ENV ? process.env.NODE_ENV === 'production' : false

// general config
export const cfg = {
  production,
  port: process.env.PORT || 3000,
  headersTimeout: 0.9 * 1000,
  maxHeadersCount: 0,
  timeout: 0.6 * 1000,
  maxBlockHistory: 100,
  maxPropagationHistory: 40,
  maxInactiveTime: 1000 * 60 * 60 * 4,
  maxBins: 40,
  maxPeerPropagation: 40,
  minPropagationRange: 0,
  maxPropagationRange: 10000,
  clientPingTimeout: 5 * 1000,
  nodeCleanupTimeout: 1000 * 60 * 60,
  statisticsInterval: 60 * 1000,
  compression,
  transport: {
    perMessageDeflate: compression
  }
}
