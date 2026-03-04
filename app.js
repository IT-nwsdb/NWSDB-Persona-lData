// Personal File Details - Single Page (Wizard Forms)
// Firestore enabled (Firebase Web SDK via CDN, ES Modules)

// Your web app's Firebase configuration (provided by you)
const firebaseConfig = {
  apiKey: "AIzaSyB0lpunlQhhd9C1ZtWIBN6Pa_0rg3Uf9jA",
  authDomain: "personaldata-800d1.firebaseapp.com",
  projectId: "personaldata-800d1",
  storageBucket: "personaldata-800d1.firebasestorage.app",
  messagingSenderId: "742454519598",
  appId: "1:742454519598:web:fb24f0af74f3447866bcbf",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const { FieldValue } = firebase.firestore;

// If you opened index.html directly (file://), Firestore may still work now (compat SDK),
// but hosting via http(s) is recommended.

const SECTIONS = [
  { id: "staff-list",       name: "Staff List" },
  { id: "transfers",        name: "Transfers" },
  { id: "retired",          name: "Retired Staff List" },
  { id: "contract",         name: "Contract" },
  { id: "lrdc",             name: "LRDC" },
  { id: "cleaning-service", name: "Cleaning Service Contract" },
  { id: "trainee",          name: "Trainee Details" },
];

const SECTION_SCHEMAS = {
  "staff-list": {
    fieldIds: ["title", "name", "idNo", "empNo", "pFileNo", "contactNo", "dob", "designationCategory", "designation", "employmentType", "appointmentDate", "serviceDurationNWSDB", "boardGrade", "site", "department", "incrementDate", "dutyReportDate", "serviceDurationCE", "retirementDate", "remarks"],
    hasForm: true,
  },
  "transfers": {
    fieldIds: ["t_title", "t_name", "t_idNo", "t_empNo", "t_pFileNo", "t_contactNo", "t_dob", "t_designationCategory", "t_designation", "t_employmentType", "t_appointmentDate", "t_serviceDurationNWSDB", "t_boardGrade", "t_site", "t_department", "t_incrementDate", "t_dutyReportDate", "t_serviceDurationCE", "t_retirementDate", "t_transferDate", "t_transferredLocation", "t_remarks"],
    hasForm: true,
  },
  "retired": {
    fieldIds: ["r_title", "r_name", "r_idNo", "r_empNo", "r_pFileNo", "r_contactNo", "r_dob", "r_designationCategory", "r_designation", "r_employmentType", "r_appointmentDate", "r_serviceDurationNWSDB", "r_boardGrade", "r_site", "r_department", "r_incrementDate", "r_dutyReportDate", "r_serviceDurationCE", "r_retirementDate", "r_remarks"],
    hasForm: true,
  },
  "contract": {
    fieldIds: ["c_name", "c_bday", "c_nic", "c_site", "c_address", "c_phone", "c_contractNo", "c_contractor", "c_contractType", "c_category"],
    hasForm: true,
  },
  "lrdc": {
    fieldIds: ["l_name", "l_empNo", "l_designation", "l_site", "l_fileNo", "l_dutyReport", "l_idNo", "l_contactNo", "l_transferDate"],
    hasForm: true,
  },
  "cleaning-service": {
    fieldIds: ["cs_name", "cs_bday", "cs_nic", "cs_site", "cs_address", "cs_phone", "cs_contractNo", "cs_contractor", "cs_contractType", "cs_category"],
    hasForm: true,
  },
  "trainee": {
    fieldIds: ["tr_name", "tr_site", "t_bday", "t_id", "t_phone", "t_course", "t_period", "t_start", "t_end"],
    hasForm: true,
  },
};

let HOME_MODE = "add"; // "add" | "records"
let EDIT_CTX = { sectionId: null, recordId: null };

// Table filters (records view)
let TABLE_STATE = {
  sectionId: null,
  q: "",
  site: "",
  department: "",
  category: "",
};

// ---------- Region / Location context (shown after loading) ----------
const CONTEXT_KEYS = { region: "pfd_region", location: "pfd_location" };
let CURRENT_CONTEXT = { region: "", location: "" };

const REGION_LOCATIONS = {
  "Central East": [
    "Ampitiya",
    "Medadumbara",
    "Pallekele",
    "Marassana",
    "Haragama",
    "Digana I",
    "Digana II",
    "Manikhinna",
    "Buluwamuduna",
    "Rikillagaskada",
    "Ragala",
    "Walapane",
    "Kundasale-Balagolla WTP",
    "Kundasale-Araththana WTP",
    "Haragama /Thennekumbura",
  ],
  "Central North": [
    "Akurana",
    "Ankumbura",
    "Bokkawala",
    "Galagedara",
    "Harispattuwa",
    "Galewela",
    "Hedeniya",
    "Pathadumbara",
    "Katugasthota",
    "Matale",
    "Dambulla",
    "Ukuwela",
    "Udathenna",
    "Naula",
    "Pussella",
    "Wilgamuwa",
  ],
  "Central South": [
    "Udaperadeniya",
    "Kadugannawa",
    "Hanthna",
    "Gannoruwa",
    "Eriyagama",
    "Nillambe",
    "Hanthana",
    "Welamboda",
    "CY-1 Gampola",
    "CY-4 Pussellawa",
    "Nawalapitiya",
    "Hatton",
    "Maskeliya",
    "Nallathanniya",
    "Sripada",
    "PudaluOya",
    "Thalawakale",
    "Ginigathhena",
    "Meepilimanna",
    "Meewatura",
    "University",
    "Doluwa",
    "Datry",
    "Gampolawatta",
    "Paradeka",
    "Ulapane",
    "Pussellawa",
    "Elpitiya",
    "Hantana",
    "Kotagala",
    "Pundaluoya",
    "Thalawakele",
    "Sri Pada",
  ],
  "Matale": [
    "Matale",
    "Raththota",
    "Pussella",
    "Ukuwela",
    "Dambulla",
    "Wilgamuwa",
    "Ambanganga",
    "Naula",
    "Galewela",
  ],
};


// Build a reverse lookup map so we can infer Region from a record's "site" field.
// (Needed for region-scoped records view, and also for older records that don't have region stored.)
const LOCATION_TO_REGIONS = (() => {
  const map = {};
  Object.keys(REGION_LOCATIONS || {}).forEach(region => {
    (REGION_LOCATIONS[region] || []).forEach(loc => {
      const k = norm(loc);
      if(!k) return;
      if(!map[k]) map[k] = [];
      if(!map[k].includes(region)) map[k].push(region);
    });
  });
  return map;
})();

function inferRegionFromLocationName(locationName, preferredRegion = ""){
  const k = norm(locationName);
  const matches = (k && LOCATION_TO_REGIONS[k]) ? LOCATION_TO_REGIONS[k] : [];
  if(preferredRegion && matches.includes(preferredRegion)) return preferredRegion;

  // If ambiguous and the location name matches a region name (e.g., "Matale"), prefer that region.
  if(!preferredRegion && matches.length > 1){
    const sameName = matches.find(r => norm(r) === k);
    if(sameName) return sameName;
  }

  return matches[0] || "";
}

// Derive a region for a record/payload based on (1) an explicit stored region field, then (2) the "site" value.
function deriveRegionFromPayload(sectionId, payload, preferredRegion = ""){
  const explicit = String(payload?.pfdRegion ?? payload?.region ?? "").trim();
  if(explicit && explicit !== "RSC") return explicit;

  const schema = SECTION_SCHEMAS[sectionId] || { fieldIds: [] };
  const siteField = findFieldFor(schema.fieldIds || [], "site");
  const siteVal = siteField ? String(payload?.[siteField] ?? "").trim() : "";

  const inferred = inferRegionFromLocationName(siteVal, preferredRegion);
  if(inferred) return inferred;

  // Fallback: if user is in a non-RSC region, assume record belongs to that region.
  if(preferredRegion && preferredRegion !== "RSC") return preferredRegion;

  return "";
}

function recordBelongsToRegion(sectionId, record, region){
  const rr = deriveRegionFromPayload(sectionId, record || {}, region);
  return String(rr || "").trim() === String(region || "").trim();
}


function uniqPreserveOrder(arr){
  const seen = new Set();
  const out = [];
  (arr || []).forEach(v => {
    const s = String(v ?? "").trim();
    if(!s) return;
    if(seen.has(s)) return;
    seen.add(s);
    out.push(s);
  });
  return out;
}

function getContext(){
  // Context is intentionally NOT persisted between app openings.
  return { ...CURRENT_CONTEXT };
}

function setContext(region, location){
  const r = String(region || "").trim();
  const l = String(location || "").trim();
  CURRENT_CONTEXT.region = r;
  CURRENT_CONTEXT.location = l;

  // Clean up any old persisted context from earlier versions (if present).
  try { localStorage.removeItem(CONTEXT_KEYS.region); } catch(e) {}
  try { localStorage.removeItem(CONTEXT_KEYS.location); } catch(e) {}

  updateContextBadge();
}

function clearContext(){
  CURRENT_CONTEXT.region = "";
  CURRENT_CONTEXT.location = "";

  // Clean up any old persisted context from earlier versions (if present).
  try { localStorage.removeItem(CONTEXT_KEYS.region); } catch(e) {}
  try { localStorage.removeItem(CONTEXT_KEYS.location); } catch(e) {}

  // Reset Region/Location selector UI (if it exists on screen).
  try {
    const regionSel = document.getElementById("regionSelect");
    const locSel = document.getElementById("locationSelect");
    const locWrap = document.getElementById("locationWrap");
    const contBtn = document.getElementById("regionContinueBtn");
    if(regionSel) regionSel.value = "";
    if(locSel){
      locSel.value = "";
      locSel.innerHTML = '<option value="" selected disabled>Select location</option>';
    }
    if(locWrap) locWrap.classList.remove("d-none");
    if(contBtn) contBtn.disabled = true;
  } catch(e) {}

  updateContextBadge();
}

function isContextReady(){
  const ctx = getContext();
  if(!ctx.region) return false;
  if(ctx.region === "RSC") return true; // no location required
  return !!ctx.location;
}

function contextLabel(){
  const ctx = getContext();
  if(!ctx.region) return "";
  if(ctx.region === "RSC") return "RSC";
  return ctx.location ? `${ctx.region} • ${ctx.location}` : ctx.region;
}

function updateContextBadge(){
  const badge = document.getElementById("contextBadge");
  const changeBtn = document.getElementById("changeContextBtn");
  const label = contextLabel();
  const ready = isContextReady();

  if(badge){
    badge.textContent = label;
    badge.classList.toggle("d-none", !ready);
  }
  if(changeBtn){
    changeBtn.classList.toggle("d-none", !ready);
  }
}

function initRegionSelector(){
  const regionSel = document.getElementById("regionSelect");
  const locSel = document.getElementById("locationSelect");
  const locWrap = document.getElementById("locationWrap");
  const contBtn = document.getElementById("regionContinueBtn");
  const clearBtn = document.getElementById("regionClearBtn");

  if(!regionSel || !locSel || !locWrap || !contBtn || !clearBtn) return;

  const setContinueEnabled = () => {
    const region = String(regionSel.value || "").trim();
    const loc = String(locSel.value || "").trim();
    const ok = !!region && (region === "RSC" || !!loc);
    contBtn.disabled = !ok;
  };

  const fillLocations = (region) => {
    locSel.innerHTML = '<option value="" selected disabled>Select location</option>';
    const list = uniqPreserveOrder(REGION_LOCATIONS[region] || []);
    list.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      locSel.appendChild(opt);
    });
  };

  regionSel.addEventListener("change", () => {
    const region = String(regionSel.value || "").trim();
    if(region === "RSC"){
      locWrap.classList.add("d-none");
      locSel.value = "";
    } else {
      locWrap.classList.remove("d-none");
      fillLocations(region);
      locSel.value = "";
    }
    setContinueEnabled();
  });

  locSel.addEventListener("change", setContinueEnabled);

  contBtn.addEventListener("click", () => {
    const region = String(regionSel.value || "").trim();
    const loc = String(locSel.value || "").trim();
    if(!region) return;

    if(region === "RSC"){
      setContext(region, "RSC");
    } else {
      if(!loc) return;
      setContext(region, loc);
    }

    // proceed to home
    location.hash = "";
    route();
  });

  clearBtn.addEventListener("click", () => {
    regionSel.value = "";
    locSel.value = "";
    locWrap.classList.remove("d-none");
    locSel.innerHTML = '<option value="" selected disabled>Select location</option>';
    contBtn.disabled = true;
    clearContext();
    location.hash = "";
    route();
  });

  // restore saved context (if any)
  const ctx = getContext();
  if(ctx.region){
    regionSel.value = ctx.region;
    if(ctx.region === "RSC"){
      locWrap.classList.add("d-none");
      locSel.value = "";
    } else {
      locWrap.classList.remove("d-none");
      fillLocations(ctx.region);
      if(ctx.location) locSel.value = ctx.location;
    }
  } else {
    locWrap.classList.remove("d-none");
    locSel.innerHTML = '<option value="" selected disabled>Select location</option>';
  }

  setContinueEnabled();
  updateContextBadge();
}

function prefillSiteField(sectionId){
  const ctx = getContext();
  if(!isContextReady()) return;
  if(ctx.region === "RSC") return;

  const schema = SECTION_SCHEMAS[sectionId];
  if(!schema) return;
  const siteFieldId = findFieldFor(schema.fieldIds || [], "site");
  if(!siteFieldId) return;

  const el = document.getElementById(siteFieldId);
  if(!el) return;

  // don't overwrite what user already typed
  if(String(el.value || "").trim() === ""){
    el.value = ctx.location;
  }
}


function norm(str){ return String(str ?? "").trim().toLowerCase(); }

function findFieldFor(fieldIds, kind){
  const k = norm(kind);
  // prefer exact matches, then contains, then suffix
  const exact = fieldIds.find(f => norm(f) === k);
  if(exact) return exact;
  const contains = fieldIds.find(f => norm(f).includes(k));
  if(contains) return contains;
  const suffix = fieldIds.find(f => norm(f).endsWith(`_${k}`));
  if(suffix) return suffix;
  return null;
}

function uniqSorted(values){
  const set = new Set(values.filter(v => String(v ?? "").trim() !== "").map(v => String(v).trim()));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

// ---------- Firestore storage ----------
// Collection names (so your Firestore structure stays neat)
const COLLECTIONS = {
  "staff-list": "staff_list",
  "transfers": "transfers",
  "retired": "retired",
  "contract": "contract",
  "lrdc": "lrdc",
  "cleaning-service": "cleaning_service",
  "trainee": "trainee",
};

function collectionNameFor(sectionId){
  return COLLECTIONS[sectionId] || sectionId;
}

const FS_STATE = {
  cache: {},      // sectionId -> [{_id, ...data}]
  unsub: {},      // sectionId -> unsubscribe function
  loading: {},    // sectionId -> boolean
  error: {},      // sectionId -> string
};

function ensureSubscribed(sectionId){
  if(FS_STATE.unsub[sectionId]) return;

  FS_STATE.loading[sectionId] = true;
  FS_STATE.error[sectionId] = "";

  const qRef = db
    .collection(collectionNameFor(sectionId))
    .orderBy("updatedAt", "desc");

  FS_STATE.unsub[sectionId] = qRef.onSnapshot(
    (snap) => {
      FS_STATE.cache[sectionId] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      FS_STATE.loading[sectionId] = false;
      FS_STATE.error[sectionId] = "";

      // If the table is currently showing this section, refresh it.
      const tableVisible = !document.getElementById("tableView")?.classList.contains("d-none");
      if(tableVisible && TABLE_STATE.sectionId === sectionId){
        renderRecordsTable(sectionId);
      }
    },
    (err) => {
      FS_STATE.loading[sectionId] = false;
      FS_STATE.error[sectionId] = err?.message || String(err);

      const tableVisible = !document.getElementById("tableView")?.classList.contains("d-none");
      if(tableVisible && TABLE_STATE.sectionId === sectionId){
        renderRecordsTable(sectionId);
      }
    }
  );
}

function loadRecords(sectionId){
  // Note: these are cached Firestore records, not localStorage.
  return FS_STATE.cache[sectionId] || [];
}

// ---------- Optional: migrate any existing localStorage data to Firestore (one time) ----------
function storageKey(sectionId){ return `pfd_records_${sectionId}`; }

function localLoadRecords(sectionId){
  try {
    const raw = localStorage.getItem(storageKey(sectionId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch(e) {
    return [];
  }
}

const LOCAL_MIGRATE_FLAG = "pfd_migrated_to_firestore_v1";

async function migrateLocalStorageToFirestore(){
  if(localStorage.getItem(LOCAL_MIGRATE_FLAG)) return;

  // Only migrate if there is something in localStorage
  const sectionIds = Object.keys(SECTION_SCHEMAS);
  const hasAny = sectionIds.some(sid => localLoadRecords(sid).length > 0);
  if(!hasAny){
    localStorage.setItem(LOCAL_MIGRATE_FLAG, "1");
    return;
  }

  try {
    for(const sectionId of sectionIds){
      const rows = localLoadRecords(sectionId);
      if(rows.length === 0) continue;

      // Firestore batch max = 500 ops; our local datasets are typically small.
      const batch = db.batch();
      rows.forEach(r => {
        const rid = r?._id;
        const data = { ...(r || {}) };
        delete data._id;

        // Add derived region (helps region-scoped records view even for old localStorage data)
        const derivedRegion = deriveRegionFromPayload(sectionId, data || {});
        if(derivedRegion) data.pfdRegion = derivedRegion;
        data.legacyLocalId = rid || null;
        data.updatedAt = FieldValue.serverTimestamp();
        data.createdAt = FieldValue.serverTimestamp();

        const targetDoc = rid
          ? db.collection(collectionNameFor(sectionId)).doc(rid)
          : db.collection(collectionNameFor(sectionId)).doc();
batch.set(targetDoc, data, { merge: true });
      });

      await batch.commit();
    }

    localStorage.setItem(LOCAL_MIGRATE_FLAG, "1");
  } catch(e) {
    console.warn("Firestore migration failed:", e);
    // Don't set the flag; user can try again later.
  }
}

function makeId(){
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function humanizeLabel(id){
  if(!id) return "";
  const stripPrefixes = id.replace(/^(t_|r_|c_|cs_|l_)/, "");
  // camelCase -> spaces
  const spaced = stripPrefixes
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  return spaced.length ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : id;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function collectFields(fieldIds){
  const data = {};
  fieldIds.forEach(fid => {
    const el = document.getElementById(fid);
    if(!el) return;

    // Support dropdown "Other" option via a paired text input:
    // <select id="X" class="allow-other">...<option value="__other__">Other...</option></select>
    // <input class="other-input" data-for="X" ...>
    if(el.tagName === "SELECT" && el.value === "__other__"){
      const otherEl = document.querySelector(`input.other-input[data-for="${fid}"]`);
      data[fid] = (otherEl?.value ?? "").trim();
    } else {
      data[fid] = (el.value ?? "").trim();
    }
  });
  return data;
}


function fillFields(fieldIds, data){
  fieldIds.forEach(fid => {
    const el = document.getElementById(fid);
    if(!el) return;

    const val = (data && data[fid] != null) ? String(data[fid]) : "";

    if(el.tagName === "SELECT"){
      const hasOption = Array.from(el.options || []).some(o => o.value === val);
      const otherEl = document.querySelector(`input.other-input[data-for="${fid}"]`);

      if(hasOption){
        el.value = val;
        if(otherEl){
          otherEl.style.display = "none";
          otherEl.required = false;
          otherEl.value = "";
        }
      } else {
        // Value isn't in dropdown -> use Other
        if(Array.from(el.options || []).some(o => o.value === "__other__")){
          el.value = "__other__";
          if(otherEl){
            otherEl.style.display = "";
            otherEl.required = true;
            otherEl.value = val;
          }
        } else {
          // Fallback: set raw value
          el.value = val;
          if(otherEl){
            otherEl.style.display = "none";
            otherEl.required = false;
            otherEl.value = "";
          }
        }
      }
    } else {
      el.value = val;
    }
  });
}const OTHER_OPTION_VALUE = "__other__";

function setupOtherDropdowns(root){
  const scope = root || document;
  const selects = Array.from(scope.querySelectorAll("select.allow-other"));
  selects.forEach(sel => {
    // Ensure "Other" option exists (safe if already added in HTML)
    if(!Array.from(sel.options || []).some(o => o.value === OTHER_OPTION_VALUE)){
      const opt = document.createElement("option");
      opt.value = OTHER_OPTION_VALUE;
      opt.textContent = "Other (type...)";
      sel.appendChild(opt);
    }

    const fid = sel.id;
    if(!fid) return;

    const otherEl = scope.querySelector(`input.other-input[data-for="${fid}"]`) || document.querySelector(`input.other-input[data-for="${fid}"]`);
    const toggle = () => {
      if(!otherEl) return;
      if(sel.value === OTHER_OPTION_VALUE){
        otherEl.style.display = "";
        otherEl.required = true;
      } else {
        otherEl.style.display = "none";
        otherEl.required = false;
        otherEl.value = "";
      }
    };

    // Bind once
    if(!sel.dataset.otherBound){
      sel.addEventListener("change", toggle);
      sel.dataset.otherBound = "1";
    }
    // Set initial state
    toggle();
  });
}




function clearInvalidInSection(sectionEl){
  if(!sectionEl) return;
  sectionEl.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  sectionEl.classList.remove("was-validated");
}

async function upsertRecord(sectionId, payload){
  const colName = collectionNameFor(sectionId);

  // Ensure required metadata and keep Firestore ordering stable
  // Also store a derived region on each record so we can show region-scoped records later.
  const ctx = getContext();
  const preferredRegion = (ctx?.region && ctx.region !== "RSC") ? String(ctx.region).trim() : "";
  const derivedRegion = deriveRegionFromPayload(sectionId, payload || {}, preferredRegion);

  const updatePayload = {
    ...(payload || {}),
    ...(derivedRegion ? { pfdRegion: derivedRegion } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    if(EDIT_CTX.sectionId === sectionId && EDIT_CTX.recordId){
      // Upsert existing doc (merge = true so you can add new fields later)
      await db.collection(colName).doc(EDIT_CTX.recordId).set(updatePayload, { merge: true });
    } else {
      await db.collection(colName).add({
        ...(payload || {}),
        ...(derivedRegion ? { pfdRegion: derivedRegion } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // clear edit context on success
    EDIT_CTX = { sectionId: null, recordId: null };
  } catch(e) {
    console.error("Firestore save failed:", e);
    throw e;
  }
}

async function deleteRecord(sectionId, recordId){
  const colName = collectionNameFor(sectionId);
  await db.collection(colName).doc(recordId).delete();
}

function resetEditCtxIfSection(sectionId){
  if(EDIT_CTX.sectionId === sectionId){
    EDIT_CTX = { sectionId: null, recordId: null };
  }

}

async function applyEditContext(sectionId){
  if(EDIT_CTX.sectionId !== sectionId || !EDIT_CTX.recordId) return;
  const schema = SECTION_SCHEMAS[sectionId];
  if(!schema || !schema.hasForm) return;

  // Prefer cached data (if user came from records table)
  const cached = loadRecords(sectionId).find(r => r._id === EDIT_CTX.recordId);
  if(cached){
    fillFields(schema.fieldIds, cached);
    return;
  }

  // Fallback: fetch directly
  try {
    const snap = await db.collection(collectionNameFor(sectionId)).doc(EDIT_CTX.recordId).get();
    if(snap.exists) fillFields(schema.fieldIds, snap.data());
} catch(e) {
    console.warn("Firestore read failed:", e);
  }
}


// Dropdown values
const DESIGNATION_CATEGORIES = [
  "ACCOUNTANT","CARE TAKER","CHEMIST","COMMERCIAL OFFICER","DRIVER","ENGINEER","ENGINEER ASSISTANT",
  "LAB ASSISTANT","LABOURER","MANAGEMENT ASSISTANT","MANAGER","MECHANIC","METER READER INSPECTOR",
  "PIPE FITTER","PLANT TECHNICIAN","PUMP OPERATOR","RECORD KEEPER","REVENUE ASSISTANT","SYSTEM ADMIN","WORK SUPERVISOR"
];

const DESIGNATIONS = [
  "ACCOUNTANT","CARE TAKER","CHEMIST","COMMERCIAL OFFICER","DRIVER","ELECTRICIAN","ENGINEER (CIVIL)",
  "ENGINEER ASSISTANT (CIVIL)","ENGINEER ASSISTANT (ELEC)","ENGINEER ASSISTANT (MECH)","LAB ASSISTANT",
  "LABOUR","LABOURER","LABOURER (M.READER)","MANAGEMENT ASSISTANT","MANAGEMENT ASSISTANT (ACCOUNTS)",
  "MANAGEMENT ASSISTANT (ACCOUNTS) SUP","MANAGEMENT ASSISTANT (CASH & FUNDS)","MANAGEMENT ASSISTANT (CRC)",
  "MANAGEMENT ASSISTANT (Computer Operator)","MANAGEMENT ASSISTANT (HR)","MANAGEMENT ASSISTANT (RECEPTIONIST)",
  "MANAGEMENT ASSISTANT (STORE KEEPER)","MANAGER (KE)","MECHANIC","METER READER INSPECTOR","PIPE FITTER",
  "PLANT TECHNICIAN","PUMP OPERATOR","RECORD KEEPER","REVENUE ASSISTANT","SENI. ENGINEER ASSISTANT (SPE)",
  "SYSTEM ADMIN","WORK SUPERVISOR"
];

// ---------- Helpers ----------
function hideIntroAfter(ms = 3000){
  const intro = document.getElementById("intro");
  if(!intro) return;
  setTimeout(() => intro.classList.add("hide"), ms);
}

function showOnly(viewId){
  ["regionView","homeView","staffListView","transfersView","retiredView","contractView","lrdcView","cleaningServiceView","traineeView","tableView"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle("d-none", id !== viewId);
  });
}

function setBackVisible(visible){
  const btn = document.getElementById("backBtn");
  if(btn) btn.classList.toggle("d-none", !visible);
}

function renderSectionList(){
  const list = document.getElementById("sectionList");
  if(!list) return;
  list.innerHTML = "";

  SECTIONS.forEach((s, idx) => {
    const a = document.createElement("a");
    a.href = `#${s.id}`;
    a.className = "list-group-item list-group-item-action d-flex align-items-center justify-content-between";
    a.innerHTML = `<span>${idx + 1}. ${s.name}</span>`;

    a.addEventListener("click", (e) => {
      e.preventDefault();
      if(HOME_MODE === "records"){
        location.hash = `#records-${s.id}`;
      } else {
        location.hash = `#${s.id}`;
      }
    });

    list.appendChild(a);
  });
}

function renderRecordsTable(sectionId){
  // Subscribe on-demand (real-time updates)
  ensureSubscribed(sectionId);

  const section = SECTIONS.find(x => x.id === sectionId);
  const schema = SECTION_SCHEMAS[sectionId] || { fieldIds: [], hasForm: false };
  const fieldIds = schema.fieldIds || [];

  // sync table state
  if(TABLE_STATE.sectionId !== sectionId){
    TABLE_STATE.sectionId = sectionId;
    TABLE_STATE.q = "";
    TABLE_STATE.site = "";
    TABLE_STATE.department = "";
    TABLE_STATE.category = "";
  }

  const title = document.getElementById("tableTitle");
  if(title) title.textContent = section ? section.name : "Section";

  const headRow = document.getElementById("tableHeadRow");
  const body = document.getElementById("tableBody");
  if(!headRow || !body) return;

  headRow.innerHTML = "";
  body.innerHTML = "";

  // build header
  fieldIds.forEach(fid => {
    const th = document.createElement("th");
    th.textContent = humanizeLabel(fid);
    headRow.appendChild(th);
  });

  const thActions = document.createElement("th");
  thActions.textContent = "Actions";
  headRow.appendChild(thActions);

  const allRows = loadRecords(sectionId);

  // Region-based access:
  // - Central East / Central North / Central South / Matale: only see records that belong to that region
  // - RSC: can see all records
  const ctx = getContext();
  const activeRegion = String(ctx?.region || "").trim();
  const baseRows = (activeRegion && activeRegion !== "RSC")
    ? allRows.filter(r => recordBelongsToRegion(sectionId, r, activeRegion))
    : allRows.slice();

  // loading / error states
  const isLoading = !!FS_STATE.loading[sectionId];
  const errMsg = FS_STATE.error[sectionId] || "";

  if(errMsg){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="${fieldIds.length + 1}" class="text-center text-danger py-4">
      Could not load records from Firestore: ${escapeHtml(errMsg)}
    </td>`;
    body.appendChild(tr);
    return;
  }

  if(isLoading && allRows.length === 0){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="${fieldIds.length + 1}" class="text-center text-secondary py-4">
      Loading...
    </td>`;
    body.appendChild(tr);
    return;
  }

  // build / update filters UI
  const searchInput = document.getElementById("tableSearchInput");
  const clearSearch = document.getElementById("tableClearSearch");
  const filterSite = document.getElementById("filterSite");
  const filterDepartment = document.getElementById("filterDepartment");
  const filterCategory = document.getElementById("filterCategory");
  const clearFiltersBtn = document.getElementById("clearTableFilters");

  const siteField = findFieldFor(fieldIds, "site");
  const deptField = findFieldFor(fieldIds, "department");
  // include things like category / designationCategory / contractType etc.
  const catField = findFieldFor(fieldIds, "category");

  function setSelectOptions(selectEl, label, values){
    if(!selectEl) return;
    selectEl.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = `All ${label}`;
    selectEl.appendChild(optAll);
    uniqSorted(values).forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      selectEl.appendChild(o);
    });
  }

  if(searchInput){
    searchInput.value = TABLE_STATE.q;
    if(!searchInput.dataset.bound){
      searchInput.dataset.bound = "1";
      searchInput.addEventListener("input", () => {
        TABLE_STATE.q = searchInput.value || "";
        renderRecordsTable(sectionId);
      });
    }
  }
  if(clearSearch){
    if(!clearSearch.dataset.bound){
      clearSearch.dataset.bound = "1";
      clearSearch.addEventListener("click", () => {
        TABLE_STATE.q = "";
        if(searchInput) searchInput.value = "";
        renderRecordsTable(sectionId);
      });
    }
  }

  function wireSelect(selectEl, key){
    if(!selectEl) return;
    if(!selectEl.dataset.bound){
      selectEl.dataset.bound = "1";
      selectEl.addEventListener("change", () => {
        TABLE_STATE[key] = selectEl.value || "";
        renderRecordsTable(sectionId);
      });
    }
  }

  // site filter
  if(filterSite){
    if(siteField){
      setSelectOptions(filterSite, "sites", baseRows.map(r => r[siteField]));
      filterSite.value = TABLE_STATE.site;
      filterSite.classList.remove("d-none");
      wireSelect(filterSite, "site");
    } else {
      filterSite.classList.add("d-none");
      TABLE_STATE.site = "";
    }
  }
  // department filter
  if(filterDepartment){
    if(deptField){
      setSelectOptions(filterDepartment, "departments", baseRows.map(r => r[deptField]));
      filterDepartment.value = TABLE_STATE.department;
      filterDepartment.classList.remove("d-none");
      wireSelect(filterDepartment, "department");
    } else {
      filterDepartment.classList.add("d-none");
      TABLE_STATE.department = "";
    }
  }
  // category filter
  if(filterCategory){
    if(catField){
      setSelectOptions(filterCategory, "categories", baseRows.map(r => r[catField]));
      filterCategory.value = TABLE_STATE.category;
      filterCategory.classList.remove("d-none");
      wireSelect(filterCategory, "category");
    } else {
      filterCategory.classList.add("d-none");
      TABLE_STATE.category = "";
    }
  }

  const anyFiltersActive = !!(TABLE_STATE.q || TABLE_STATE.site || TABLE_STATE.department || TABLE_STATE.category);
  if(clearFiltersBtn){
    clearFiltersBtn.classList.toggle("d-none", !anyFiltersActive);
    if(!clearFiltersBtn.dataset.bound){
      clearFiltersBtn.dataset.bound = "1";
      clearFiltersBtn.addEventListener("click", () => {
        TABLE_STATE.q = "";
        TABLE_STATE.site = "";
        TABLE_STATE.department = "";
        TABLE_STATE.category = "";
        if(searchInput) searchInput.value = "";
        if(filterSite) filterSite.value = "";
        if(filterDepartment) filterDepartment.value = "";
        if(filterCategory) filterCategory.value = "";
        renderRecordsTable(sectionId);
      });
    }
  }

  // apply filters
  const q = norm(TABLE_STATE.q);
  let rows = baseRows.slice();

  if(q){
    rows = rows.filter(r => fieldIds.some(fid => norm(r[fid]).includes(q)));
  }
  if(siteField && TABLE_STATE.site){
    rows = rows.filter(r => String(r[siteField] ?? "").trim() === TABLE_STATE.site);
  }
  if(deptField && TABLE_STATE.department){
    rows = rows.filter(r => String(r[deptField] ?? "").trim() === TABLE_STATE.department);
  }
  if(catField && TABLE_STATE.category){
    rows = rows.filter(r => String(r[catField] ?? "").trim() === TABLE_STATE.category);
  }

  if(rows.length === 0){
    const tr = document.createElement("tr");

    let msg = "No records match your filters.";
    if(baseRows.length === 0){
      if(allRows.length === 0){
        msg = "No records yet.";
      } else if(activeRegion && activeRegion !== "RSC"){
        msg = `No records for ${escapeHtml(activeRegion)}.`;
      } else {
        msg = "No records yet.";
      }
    }

    tr.innerHTML = `<td colspan="${fieldIds.length + 1}" class="text-center text-secondary py-4">${msg}</td>`;
    body.appendChild(tr);
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement("tr");

    const tds = fieldIds.map(fid => {
      const val = (r && r[fid] != null) ? r[fid] : "";
      return `<td title="${escapeAttr(String(val))}">${escapeHtml(String(val))}</td>`;
    }).join("");

    const editDisabled = !(SECTION_SCHEMAS[sectionId] && SECTION_SCHEMAS[sectionId].hasForm);
    tr.innerHTML = `
      ${tds}
      <td class="text-nowrap">
        <button class="btn btn-sm btn-outline-secondary me-1" data-action="edit" data-id="${r._id}" ${editDisabled ? "disabled" : ""}>
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${r._id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    body.appendChild(tr);
  });

  // delegate row actions
  body.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const action = btn.getAttribute("data-action");
      const rid = btn.getAttribute("data-id");
      if(!rid) return;

      if(action === "delete"){
        const ok = confirm("Delete this record?");
        if(!ok) return;
        try {
          await deleteRecord(sectionId, rid);
        } catch(e) {
          alert("Delete failed. Check Firestore permissions / rules.");
        }
        return;
      }

      if(action === "edit"){
        EDIT_CTX = { sectionId, recordId: rid };
        location.hash = `#${sectionId}`;
      }
    });
  });
}


function fillSelect(selectEl, values, placeholder){
  if(!selectEl) return;
  selectEl.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder || "Select";
  ph.disabled = true;
  ph.selected = true;
  selectEl.appendChild(ph);

  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    selectEl.appendChild(o);
  });
}

function calcDuration(isoDate){
  if(!isoDate) return "";
  const start = new Date(isoDate);
  const now = new Date();
  if(Number.isNaN(start.getTime())) return "";
  if(start > now) return "0 years";

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if(days < 0) months -= 1;
  if(months < 0){ years -= 1; months += 12; }
  if(years < 0) years = 0;
  if(months < 0) months = 0;

  if(months === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}

// ---------- Generic Wizard (supports Staff + Transfers) ----------
function createWizard(opts){
  const {
    // DOM ids
    stepSelector, tabsSelector,
    prevBtnId, nextBtnId, clearBtnId, saveBtnId,
    badgeId, hintId, progressBarId,
    formId, savedAlertId,
    // step hints
    stepHints,
    // onInit callback
    onInit,
    // onAfterSave callback
    onAfterSave,
  } = opts;

  let step = 0;

  const getSteps = () => Array.from(document.querySelectorAll(stepSelector));

  const setStep = (idx) => {
    const steps = getSteps();
    if(steps.length === 0) return;

    step = Math.max(0, Math.min(idx, steps.length - 1));
    steps.forEach((el, i) => el.classList.toggle("d-none", i !== step));

    document.querySelectorAll(`${tabsSelector} .nav-link`).forEach((btn, i) => {
      btn.classList.toggle("active", i === step);
    });

    const pct = Math.round(((step + 1) / steps.length) * 100);
    const bar = document.getElementById(progressBarId);
    if(bar) bar.style.width = `${pct}%`;

    const badge = document.getElementById(badgeId);
    if(badge) badge.textContent = `Step ${step + 1} of ${steps.length}`;

    const hint = document.getElementById(hintId);
    if(hint) hint.textContent = stepHints?.[step] || "";

    const prev = document.getElementById(prevBtnId);
    const next = document.getElementById(nextBtnId);
    if(prev) prev.disabled = step === 0;
    if(next) next.innerHTML = (step === steps.length - 1)
      ? 'Finish <i class="bi bi-check2"></i>'
      : 'Next <i class="bi bi-chevron-right"></i>';
  };

  const validateStep = (formEl) => {
    const steps = getSteps();
    const active = steps[step];
    if(!active) return true;

    const controls = Array.from(active.querySelectorAll("input, select, textarea"));
    let ok = true;
    controls.forEach(c => {
      if(typeof c.checkValidity === "function" && !c.checkValidity()) ok = false;
    });

    if(!ok) formEl.classList.add("was-validated");
    return ok;
  };

  const doSave = async () => {
    const formEl = document.getElementById(formId);
    if(!formEl) return;

    if(!formEl.checkValidity()){
      formEl.classList.add("was-validated");
      return;
    }

    const alertEl = document.getElementById(savedAlertId);
    const showMsg = (type, msg) => {
      if(!alertEl) return;
      alertEl.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
      alertEl.classList.add(type === "success" ? "alert-success" : (type === "warning" ? "alert-warning" : "alert-danger"));
      alertEl.textContent = msg;
      setTimeout(() => alertEl.classList.add("d-none"), 3000);
    };

    if(typeof onAfterSave === "function"){
      try {
        await onAfterSave({ formEl });
        showMsg("success", "Saved to Firestore.");
      } catch(e) {
        showMsg("danger", "Save failed. Check Firestore permissions / rules.");
      }
    }
  };

  const init = () => {
    const formEl = document.getElementById(formId);
    if(!formEl) return;

    // tabs
    document.querySelectorAll(`${tabsSelector} .nav-link`).forEach(btn => {
      btn.addEventListener("click", () => {
        const target = Number(btn.getAttribute("data-step") || "0");
        if(target > step && !validateStep(formEl)) return;
        setStep(target);
      });
    });

    // prev/next
    const prev = document.getElementById(prevBtnId);
    const next = document.getElementById(nextBtnId);

    if(prev) prev.addEventListener("click", () => setStep(step - 1));
    if(next) next.addEventListener("click", async () => {
      if(!validateStep(formEl)) return;
      const last = getSteps().length - 1;
      if(step < last){
        setStep(step + 1);
      } else {
        await doSave();
      }
    });

    // clear/save
    const clearBtn = document.getElementById(clearBtnId);
    const saveBtn = document.getElementById(saveBtnId);

    if(clearBtn){
      clearBtn.addEventListener("click", () => {
        formEl.reset();
        formEl.classList.remove("was-validated");
        // let onInit handle any recalcs after reset
        if(typeof onInit === "function") onInit({ reset: true });
        setupOtherDropdowns(formEl);
        setStep(0);
      });
    }

    if(saveBtn) saveBtn.addEventListener("click", async () => { await doSave(); });

    // prevent Enter from submitting
    formEl.addEventListener("submit", (e) => e.preventDefault());

    // init content (dropdowns/duration)
    if(typeof onInit === "function") onInit({ reset: false });
    setupOtherDropdowns(formEl);

    setStep(0);
  };

  return { init, setStep };
}

// ---------- Staff Wizard init ----------
let staffWizard;
function initStaffWizard(){
  staffWizard = createWizard({
    stepSelector: ".staff-step",
    tabsSelector: "#wizardTabs",
    prevBtnId: "prevStepBtn",
    nextBtnId: "nextStepBtn",
    clearBtnId: "wizardClearBtn",
    saveBtnId: "wizardSaveBtn",
    badgeId: "stepBadge",
    hintId: "stepHint",
    progressBarId: "wizardProgressBar",
    formId: "staffForm",
    savedAlertId: "savedAlert",
    stepHints: ["Identity details", "Employment details", "Other details"],
    onInit: () => {
      fillSelect(document.getElementById("designationCategory"), DESIGNATION_CATEGORIES, "Select designation category");
      fillSelect(document.getElementById("designation"), DESIGNATIONS, "Select designation");

      const appt = document.getElementById("appointmentDate");
      const dur = document.getElementById("serviceDurationNWSDB");
      const update = () => { if(dur) dur.value = calcDuration(appt?.value); };
      if(appt){
        appt.addEventListener("input", update);
        appt.addEventListener("change", update);
      }
      update();
    },

    onAfterSave: async () => {
      const schema = SECTION_SCHEMAS["staff-list"];
      const payload = collectFields(schema.fieldIds);
      await upsertRecord("staff-list", payload);
    },
  });

  staffWizard.init();
}

// ---------- Transfers Wizard init ----------
let transfersWizard;
function initTransfersWizard(){
  transfersWizard = createWizard({
    stepSelector: ".transfer-step",
    tabsSelector: "#transferTabs",
    prevBtnId: "transferPrevBtn",
    nextBtnId: "transferNextBtn",
    clearBtnId: "transferClearBtn",
    saveBtnId: "transferSaveBtn",
    badgeId: "transferStepBadge",
    hintId: "transferStepHint",
    progressBarId: "transferProgressBar",
    formId: "transferForm",
    savedAlertId: "transferSavedAlert",
    stepHints: ["Identity details", "Employment details", "Transfer details"],
    onInit: () => {
      fillSelect(document.getElementById("t_designationCategory"), DESIGNATION_CATEGORIES, "Select designation category");
      fillSelect(document.getElementById("t_designation"), DESIGNATIONS, "Select designation");

      const appt = document.getElementById("t_appointmentDate");
      const dur = document.getElementById("t_serviceDurationNWSDB");
      const update = () => { if(dur) dur.value = calcDuration(appt?.value); };
      if(appt){
        appt.addEventListener("input", update);
        appt.addEventListener("change", update);
      }
      update();
    },

    onAfterSave: async () => {
      const schema = SECTION_SCHEMAS["transfers"];
      const payload = collectFields(schema.fieldIds);
      await upsertRecord("transfers", payload);
    },
  });

  transfersWizard.init();
}


// ---------- Retired Staff Wizard ----------
let retiredStep = 0;
function getRetiredSteps(){
  return Array.from(document.querySelectorAll(".retired-step"));
}
function setRetiredWizardStep(stepIdx){
  const stepEls = getRetiredSteps();
  if(stepEls.length === 0) return;

  retiredStep = Math.max(0, Math.min(stepIdx, stepEls.length - 1));
  stepEls.forEach((el, idx) => el.classList.toggle("d-none", idx !== retiredStep));

  document.querySelectorAll("#retiredTabs .nav-link").forEach((btn, idx) => {
    btn.classList.toggle("active", idx === retiredStep);
  });

  const pct = Math.round(((retiredStep + 1) / stepEls.length) * 100);
  const bar = document.getElementById("retiredProgressBar");
  if(bar) bar.style.width = `${pct}%`;

  const badge = document.getElementById("retiredStepBadge");
  if(badge) badge.textContent = `Step ${retiredStep + 1} of ${stepEls.length}`;

  const hint = document.getElementById("retiredStepHint");
  const hints = ["Identity details", "Employment details", "Dates & remarks"];
  if(hint) hint.textContent = hints[retiredStep] || "";

  const prev = document.getElementById("retiredPrevBtn");
  const next = document.getElementById("retiredNextBtn");
  if(prev) prev.disabled = retiredStep === 0;
  if(next) next.innerHTML = (retiredStep === stepEls.length - 1) ? 'Finish <i class="bi bi-check2"></i>' : 'Next <i class="bi bi-chevron-right"></i>';
}
function validateRetiredStep(form){
  const stepEls = getRetiredSteps();
  const active = stepEls[retiredStep];
  if(!active) return true;

  const controls = Array.from(active.querySelectorAll("input, select, textarea"));
  let ok = true;
  controls.forEach(c => {
    if(typeof c.checkValidity === "function" && !c.checkValidity()){
      ok = false;
    }
  });
  if(!ok) form.classList.add("was-validated");
  return ok;
}
function initRetiredWizard(){
  fillSelect(document.getElementById("r_designationCategory"), DESIGNATION_CATEGORIES, "Select designation category");
  fillSelect(document.getElementById("r_designation"), DESIGNATIONS, "Select designation");

  const appt = document.getElementById("r_appointmentDate");
  const dur = document.getElementById("r_serviceDurationNWSDB");
  const update = () => { if(dur) dur.value = calcDuration(appt?.value); };
  if(appt){
    appt.addEventListener("input", update);
    appt.addEventListener("change", update);
  }
  update();

  const form = document.getElementById("retiredForm");
  const clearBtn = document.getElementById("retiredClearBtn");
  const saveBtn = document.getElementById("retiredSaveBtn");
  const prevBtn = document.getElementById("retiredPrevBtn");
  const nextBtn = document.getElementById("retiredNextBtn");

  document.querySelectorAll("#retiredTabs .nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.getAttribute("data-step") || "0");
      if(step > retiredStep && form && !validateRetiredStep(form)) return;
      setRetiredWizardStep(step);
    });
  });

  if(prevBtn) prevBtn.addEventListener("click", () => setRetiredWizardStep(retiredStep - 1));
  if(nextBtn) nextBtn.addEventListener("click", async () => {
    if(form && !validateRetiredStep(form)) return;
    const last = getRetiredSteps().length - 1;
    if(retiredStep < last){
      setRetiredWizardStep(retiredStep + 1);
      return;
    }
    await doRetiredSave();
  });

  if(clearBtn && form){
    clearBtn.addEventListener("click", () => {
      form.reset();
      form.classList.remove("was-validated");
      if(dur) dur.value = "";
      EDIT_CTX = { sectionId: null, recordId: null };
      setRetiredWizardStep(0);
    });
  }
  if(saveBtn) saveBtn.addEventListener("click", async () => { await doRetiredSave(); });

  if(form){
    form.addEventListener("submit", (e) => e.preventDefault());
  }
  setRetiredWizardStep(0);
}

async function doRetiredSave(){
  const form = document.getElementById("retiredForm");
  if(!form) return;

  if(!form.checkValidity()){
    form.classList.add("was-validated");
    return;
  }

  const alertEl = document.getElementById("retiredSavedAlert");
  const showMsg = (type, msg) => {
    if(!alertEl) return;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
    alertEl.classList.add(type === "success" ? "alert-success" : (type === "warning" ? "alert-warning" : "alert-danger"));
    alertEl.textContent = msg;
    setTimeout(() => alertEl.classList.add("d-none"), 3000);
  };

  try {
    const payload = collectFields(SECTION_SCHEMAS["retired"].fieldIds);
    await upsertRecord("retired", payload);
    showMsg("success", "Saved to Firestore.");
  } catch(e) {
    showMsg("danger", "Save failed. Check Firestore permissions / rules.");
  }
}


// ---------- Contract Form ----------
function initContractForm(){
  const section = document.getElementById("contractView");
  const name = document.getElementById("c_name");
  const site = document.getElementById("c_site");
  const type = document.getElementById("c_contractType");
  const cat  = document.getElementById("c_category");

  const clearBtn = document.getElementById("contractClearBtn");
  const saveBtn  = document.getElementById("contractSaveBtn");
  const alertEl  = document.getElementById("contractSavedAlert");

  function hideAlert(){
    if(alertEl) alertEl.classList.add("d-none");
  }

  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      // clear all inputs inside contract section
      section.querySelectorAll("input, select, textarea").forEach(el => {
        if(el.tagName === "SELECT") el.selectedIndex = 0;
        else el.value = "";
        el.classList.remove("is-invalid");
      });
      hideAlert();
      resetEditCtxIfSection("contract");
    });
  }

  const showMsg = (type, msg) => {
    if(!alertEl) return;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
    alertEl.classList.add(type === "success" ? "alert-success" : (type === "warning" ? "alert-warning" : "alert-danger"));
    alertEl.textContent = msg;
    setTimeout(() => alertEl.classList.add("d-none"), 3000);
  };

  if(saveBtn){
    saveBtn.addEventListener("click", async () => {
      hideAlert();
      // basic required validation
      let ok = true;
      [name, site, type, cat].forEach(el => {
        if(!el) return;
        if(!el.value){
          ok = false;
          el.classList.add("is-invalid");
        } else {
          el.classList.remove("is-invalid");
        }
      });

      if(!ok) return;

      try {
        const payload = collectFields(SECTION_SCHEMAS["contract"].fieldIds);
        await upsertRecord("contract", payload);
        showMsg("success", "Saved to Firestore.");
      } catch(e) {
        showMsg("danger", "Save failed. Check Firestore permissions / rules.");
      }
    });
  }

  // remove invalid state when typing
  [name, site, type, cat].forEach(el => {
    if(!el) return;
    el.addEventListener("input", () => el.classList.remove("is-invalid"));
    el.addEventListener("change", () => el.classList.remove("is-invalid"));
  });
}


function initCleaningServiceForm(){
  const section = document.getElementById("cleaningServiceView");
  const name = document.getElementById("cs_name");
  const site = document.getElementById("cs_site");
  const type = document.getElementById("cs_contractType");
  const cat  = document.getElementById("cs_category");

  const clearBtn = document.getElementById("cleaningClearBtn");
  const saveBtn  = document.getElementById("cleaningSaveBtn");
  const alertEl  = document.getElementById("cleaningSavedAlert");

  function hideAlert(){
    if(alertEl) alertEl.classList.add("d-none");
  }

  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      // clear all inputs inside cleaning service contract section
      section.querySelectorAll("input, select, textarea").forEach(el => {
        if(el.tagName === "SELECT") el.selectedIndex = 0;
        else el.value = "";
        el.classList.remove("is-invalid");
      });
      hideAlert();
      resetEditCtxIfSection("cleaning-service");
    });
  }

  const showMsg = (type, msg) => {
    if(!alertEl) return;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
    alertEl.classList.add(type === "success" ? "alert-success" : (type === "warning" ? "alert-warning" : "alert-danger"));
    alertEl.textContent = msg;
    setTimeout(() => alertEl.classList.add("d-none"), 3000);
  };

  if(saveBtn){
    saveBtn.addEventListener("click", async () => {
      hideAlert();
      // basic required validation
      let ok = true;
      [name, site, type, cat].forEach(el => {
        if(!el) return;
        if(!el.value){
          ok = false;
          el.classList.add("is-invalid");
        } else {
          el.classList.remove("is-invalid");
        }
      });

      if(!ok) return;

      try {
        const payload = collectFields(SECTION_SCHEMAS["cleaning-service"].fieldIds);
        await upsertRecord("cleaning-service", payload);
        showMsg("success", "Saved to Firestore.");
      } catch(e) {
        showMsg("danger", "Save failed. Check Firestore permissions / rules.");
      }
    });
  }

  // remove invalid state when typing
  [name, site, type, cat].forEach(el => {
    if(!el) return;
    el.addEventListener("input", () => el.classList.remove("is-invalid"));
    el.addEventListener("change", () => el.classList.remove("is-invalid"));
  });
}

function initTraineeForm(){
  const section = document.getElementById("traineeView");
  const name  = document.getElementById("tr_name");
  const site  = document.getElementById("tr_site");
  const idNo  = document.getElementById("t_id");
  const start = document.getElementById("t_start");
  const end   = document.getElementById("t_end");

  const clearBtn = document.getElementById("traineeClearBtn");
  const saveBtn  = document.getElementById("traineeSaveBtn");
  const alertEl  = document.getElementById("traineeSavedAlert");

  function hideAlert(){
    if(alertEl) alertEl.classList.add("d-none");
  }

  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      section.querySelectorAll("input, select, textarea").forEach(el => {
        if(el.tagName === "SELECT") el.selectedIndex = 0;
        else el.value = "";
        el.classList.remove("is-invalid");
      });
      hideAlert();
      resetEditCtxIfSection("trainee");
    });
  }

  const showMsg = (type, msg) => {
    if(!alertEl) return;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
    alertEl.classList.add(type === "success" ? "alert-success" : (type === "warning" ? "alert-warning" : "alert-danger"));
    alertEl.textContent = msg;
    setTimeout(() => alertEl.classList.add("d-none"), 3000);
  };

  if(saveBtn){
    saveBtn.addEventListener("click", async () => {
      hideAlert();

      // required validation
      let ok = true;
      [name, site, idNo, start, end].forEach(el => {
        if(!el) return;
        if(!el.value){
          ok = false;
          el.classList.add("is-invalid");
        } else {
          el.classList.remove("is-invalid");
        }
      });

      // basic date sanity check (optional but helpful)
      if(ok && start.value && end.value){
        const s = new Date(start.value);
        const e = new Date(end.value);
        if(e < s){
          ok = false;
          end.classList.add("is-invalid");
        }
      }

      if(!ok) return;

      try {
        const payload = collectFields(SECTION_SCHEMAS["trainee"].fieldIds);
        await upsertRecord("trainee", payload);
        showMsg("success", "Saved to Firestore.");
      } catch(e) {
        showMsg("danger", "Save failed. Check Firestore permissions / rules.");
      }
    });
  }

  // remove invalid state when typing
  [name, site, idNo, start, end].forEach(el => {
    if(!el) return;
    el.addEventListener("input", () => el.classList.remove("is-invalid"));
    el.addEventListener("change", () => el.classList.remove("is-invalid"));
  });
}







// ---------- LRDC Form ----------
function initLRDCForm(){
  const section = document.getElementById("lrdcView");
  const name = document.getElementById("l_name");
  const clearBtn = document.getElementById("lrdcClearBtn");
  const saveBtn = document.getElementById("lrdcSaveBtn");
  const alertEl = document.getElementById("lrdcSavedAlert");

  const showMsg = (type, msg) => {
    if(!alertEl) return;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
    alertEl.classList.add(type === "success" ? "alert-success" : (type === "warning" ? "alert-warning" : "alert-danger"));
    alertEl.textContent = msg;
    setTimeout(() => alertEl.classList.add("d-none"), 3000);
  };

  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      section.querySelectorAll("input, select").forEach(el => {
        if(el.type === "date") el.value = "";
        else el.value = "";
        el.classList.remove("is-invalid");
      });
      alertEl.classList.add("d-none");
      resetEditCtxIfSection("lrdc");
    });
  }

  if(saveBtn){
    saveBtn.addEventListener("click", async () => {
      let ok = true;
      if(!name.value){
        name.classList.add("is-invalid");
        ok = false;
      } else {
        name.classList.remove("is-invalid");
      }
      if(!ok) return;


      try {
        const payload = collectFields(SECTION_SCHEMAS["lrdc"].fieldIds);
        await upsertRecord("lrdc", payload);
        showMsg("success", "Saved to Firestore.");
      } catch(e) {
        showMsg("danger", "Save failed. Check Firestore permissions / rules.");
      }
    });
  }

  if(name){
    name.addEventListener("input", () => name.classList.remove("is-invalid"));
  }
}

// ---------- Routing ----------
function route(){
  const id = (location.hash || "").replace("#","").trim();

  // Force region/location selection before using the app
  if(!isContextReady()){
    showOnly("regionView");
    setBackVisible(false);
    return;
  }

  if(!id){
    showOnly("homeView");
    setBackVisible(false);
    return;
  }

  if(id.startsWith("records-")){
    const sectionId = id.replace("records-","").trim();
    showOnly("tableView");
    renderRecordsTable(sectionId);
    setBackVisible(true);
    return;
  }

  if(id === "staff-list"){
    showOnly("staffListView");
    prefillSiteField("staff-list");
    setBackVisible(true);
    staffWizard && staffWizard.setStep(0);
    void applyEditContext("staff-list");
    return;
  }

  if(id === "transfers"){
    showOnly("transfersView");
    prefillSiteField("transfers");
    setBackVisible(true);
    transfersWizard && transfersWizard.setStep(0);
    void applyEditContext("transfers");
    return;
  }

  if(id === "retired"){
    showOnly("retiredView");
    prefillSiteField("retired");
    setBackVisible(true);
      setRetiredWizardStep(0);
      void applyEditContext("retired");
return;
  }

  
  if(id === "lrdc"){
    showOnly("lrdcView");
    prefillSiteField("lrdc");
    setBackVisible(true);
    void applyEditContext("lrdc");
    return;
  }

  if(id === "contract"){
    showOnly("contractView");
    prefillSiteField("contract");
    setBackVisible(true);
    void applyEditContext("contract");
    return;
  }


  if(id === "cleaning-service"){
    showOnly("cleaningServiceView");
    prefillSiteField("cleaning-service");
    setBackVisible(true);
    void applyEditContext("cleaning-service");
    return;
  }


  if(id === "trainee"){
    showOnly("traineeView");
    prefillSiteField("trainee");
    setBackVisible(true);
    void applyEditContext("trainee");
    return;
  }

showOnly("tableView");
  renderRecordsTable(id);
  setBackVisible(true);
}

document.addEventListener("DOMContentLoaded", () => {
  // Always start fresh: show loading screen, then Region/Location selection.
  // (No persistence of Region/Location between app openings.)
  clearContext();
  try { location.hash = ""; } catch(e) {}

  hideIntroAfter(3000);
  void migrateLocalStorageToFirestore();
  renderSectionList();

  initRegionSelector();
  updateContextBadge();

  const changeCtx = document.getElementById("changeContextBtn");
  if(changeCtx){
    changeCtx.addEventListener("click", () => {
      clearContext();
      location.hash = "";
      route();
    });
  }

  const viewBtn = document.getElementById("viewRecordsBtn");
  const badge = document.getElementById("viewModeBadge");
  if(viewBtn){
    const refresh = () => {
      if(HOME_MODE === "records"){
        viewBtn.classList.remove("btn-outline-primary");
        viewBtn.classList.add("btn-primary");
        viewBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Add / edit data';
        if(badge) badge.classList.remove("d-none");
      } else {
        viewBtn.classList.add("btn-outline-primary");
        viewBtn.classList.remove("btn-primary");
        viewBtn.innerHTML = '<i class="bi bi-table"></i> View records';
        if(badge) badge.classList.add("d-none");
      }
    };
    refresh();
    viewBtn.addEventListener("click", () => {
      HOME_MODE = (HOME_MODE === "records") ? "add" : "records";
      refresh();
      // go back to home when toggling modes
      location.hash = "";
    });
  }

  initStaffWizard();
  initTransfersWizard();
  initRetiredWizard();
  initContractForm();
  initCleaningServiceForm();
  initTraineeForm();
  initLRDCForm();

  // clear edit context when user clears forms
  const staffClear = document.getElementById("wizardClearBtn");
  if(staffClear) staffClear.addEventListener("click", () => resetEditCtxIfSection("staff-list"));

  const transferClear = document.getElementById("transferClearBtn");
  if(transferClear) transferClear.addEventListener("click", () => resetEditCtxIfSection("transfers"));

  const retiredClear = document.getElementById("retiredClearBtn");
  if(retiredClear) retiredClear.addEventListener("click", () => resetEditCtxIfSection("retired"));
  route();

  window.addEventListener("hashchange", route);

  const backBtn = document.getElementById("backBtn");
  if(backBtn){
    backBtn.addEventListener("click", () => {
      location.hash = "";
    });
  }
});
