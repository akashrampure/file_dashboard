export interface FirmwareData {
  filepackagecode: string;
  groupid: number;
  groupname: string;
  modelid: number;
  modelname: string;
  assetmeta: string;
  filesolutioncode: string;
  status: string;
  firmwaretype: string;
  networktype: string;
  modemversion: string;
  hardwareversion: string;
  addonhardwareversion: string;
  networkprovider: string;
  mainfirmwarebootloader: string;
  mainfirmware: string;
  mainsettingsname: string;
  mainsettingsid: string;
  coprocfirmware: string;
  coprocsettingsname: string;
  plsign: string;
  isvalid: boolean;
  updatedby: string;
  updatedat: number;
}

export interface GroupSuggestion {
  groupname: string;
  groupid: number;
  isNewGroup: boolean;
}

export interface ModelSuggestion {
  modelname: string;
  modelid: number;
  isNewModel: boolean;
}

export interface User {
  isAuthenticated: any;
  avatar: string | undefined;
  email: string;
  role: string;
  id?: string;
}

export interface UserManagement extends User {
  id: string;
}

export interface HarnessData {
  slno: number;
  phcode: string;
  ahcode: string;
  currentstock: number;
  vehicletype: string;
  vehicleoem: string;
  vehiclemodel: string;
  vehiclevariant: string;
  yearofmfg: string;
  fueltype: string;
  transmissiontype: string;
  ignitiontype: string;
  devicetype: string;
  specification: string;
  immotype: string;
  immorelayvoltage: string;
  can: string;
  panic: string;
  devversion: string;
  harnessimage: string;
  diagram: string;
  rev: number;
  description: string;
  updatedby: string;
  updatedat: number;
}