/**
 * Maps campaign/group names to their constituent ArkhamDB pack codes.
 * Used to group individual card packs into logical collections for filtering.
 */
export const PACK_STRUCTURE: Record<string, string[]> = {
  core: ["core", "core_encounter"],
  "core 2026": ["core_2026", "core_2026_encounter"],
  rcore: ["rcore"],
  dwl: ["bota", "bota_encounter", "dwl", "dwl_encounter", "litas", "litas_encounter", "tece", "tece_encounter", "tmm", "tmm_encounter", "uau", "uau_encounter", "wda", "wda_encounter"],
  ptc: ["apot", "apot_encounter", "bsr", "bsr_encounter", "dca", "dca_encounter", "eotp", "eotp_encounter", "ptc", "ptc_encounter", "tpm", "tpm_encounter", "tuo", "tuo_encounter"],
  tfa: ["hote", "hote_encounter", "sha", "sha_encounter", "tbb", "tbb_encounter", "tcoa", "tcoa_encounter", "tdoy", "tdoy_encounter", "tfa", "tfa_encounter", "tof", "tof_encounter"],
  tcu: ["bbt", "bbt_encounter", "fgg", "fgg_encounter", "icc", "icc_encounter", "tcu", "tcu_encounter", "tsn", "tsn_encounter", "uad", "uad_encounter", "wos", "wos_encounter"],
  tde: ["dsm", "dsm_encounter", "pnr", "pnr_encounter", "sfk", "sfk_encounter", "tde", "tde_encounter", "tsh", "tsh_encounter", "wgd", "wgd_encounter", "woc", "woc_encounter"],
  tic: ["def", "def_encounter", "hhg", "hhg_encounter", "itd", "itd_encounter", "itm", "itm_encounter", "lif", "lif_encounter", "lod", "lod_encounter", "tic", "tic_encounter"],
  eoe: ["eoec", "eoep"],
  fhv: ["fhvc", "fhvp"],
  tsk: ["tskc", "tskp"],
  tdc: ["tdcc", "tdcp"],
  parallel: ["aof", "aon", "aon_encounter", "bad", "bad_encounter", "btb", "btb_encounter", "enc", "enc_encounter", "hfa", "ltr", "ltr_encounter", "otr", "pap", "ptr", "rod", "rod_encounter", "rop", "rop_encounter", "rtr", "rtr_encounter"],
  return: ["rtdwl", "rtdwl_encounter", "rtnotz", "rtnotz_encounter", "rtptc", "rtptc_encounter", "rttcu", "rttcu_encounter", "rttfa", "rttfa_encounter"],
  investigator: ["and", "car", "har", "jac", "mar", "mig", "nat", "ste", "tom", "win"],
  side: ["blbe", "blbe_encounter", "blob", "blob_encounter", "coh", "coh_encounter", "cotr", "cotr_encounter", "film_fatale", "film_fatale_encounter", "fof", "fof_encounter", "guardians", "guardians_encounter", "hotel", "hotel_encounter", "lol", "lol_encounter", "mtt", "mtt_encounter", "tmg", "tmg_encounter", "wog", "wog_encounter"],
  promo: ["bob", "dre", "hoth", "iotv", "promo", "tdg", "tdor", "tftbw"],
};

/**
 * Builds a reverse lookup map: pack_code → group name.
 * Cards whose pack_code is not in the map should be assigned to "other".
 */
export function buildPackCodeToGroupMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [groupName, packCodes] of Object.entries(PACK_STRUCTURE)) {
    for (const code of packCodes) {
      map.set(code, groupName.toUpperCase());
    }
  }
  return map;
}
