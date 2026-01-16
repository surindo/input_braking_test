import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  "https://eysofbxczoaesihxpelb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c29mYnhjem9hZXNpaHhwZWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjM4MjIsImV4cCI6MjA3ODYzOTgyMn0.X4Nec16yXjcrQtpUzAlkwJDgQKHKz8lqU4WF7kjp2KU"
);

const form = document.getElementById("myForm");
const sesiEl = document.getElementById("sesi");
const brandEl = document.getElementById("brand");
const typeEl = document.getElementById("type");

const inputs = {
  t1: document.getElementById("t1"),
  t2: document.getElementById("t2"),
  t3: document.getElementById("t3"),
  t4: document.getElementById("t4"),
  t5: document.getElementById("t5"),
};

/* ===== UTIL: TANGGAL HARI INI ===== */
function todayRange() {
  const today = new Date().toISOString().split("T")[0];
  return {
    start: today + "T00:00:00",
    end: today + "T23:59:59"
  };
}

/* ===== LOAD DATA HARI INI ===== */
async function loadData() {
  showLoading();
  Object.values(inputs).forEach(i => i.value = "");

  if (!sesiEl.value || !brandEl.value || !typeEl.value) {
    hideLoading();
    return;
  }

  const { start, end } = todayRange();

  const { data, error } = await supabase
    .from("braking")
    .select("*")
    .eq("sesi", sesiEl.value)
    .eq("brand", brandEl.value)
    .eq("type", Number(typeEl.value))
    .gte("created_at", start)
    .lte("created_at", end)
    .limit(1)
    .maybeSingle(); 

  if (error) {
    console.error("Load data error:", error.message);
    hideLoading();
    return;
  }

  if (data) {
    Object.keys(inputs).forEach(k => {
      inputs[k].value = data[k] ?? "";
    });
  }

  hideLoading();
}

sesiEl.addEventListener("change", loadData);
brandEl.addEventListener("change", loadData);
typeEl.addEventListener("change", loadData);

/* ===== SUBMIT ===== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    sesi: Number(sesiEl.value),
    brand: brandEl.value,
    type: Number(typeEl.value), // 1=Dry, 2=Wet
    t1: inputs.t1.value === "" ? null : Number(inputs.t1.value),
    t2: inputs.t2.value === "" ? null : Number(inputs.t2.value),
    t3: inputs.t3.value === "" ? null : Number(inputs.t3.value),
    t4: inputs.t4.value === "" ? null : Number(inputs.t4.value),
    t5: inputs.t5.value === "" ? null : Number(inputs.t5.value),
  };

  const { start, end } = todayRange();

  const confirm = await Swal.fire({
    title: "Simpan data?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal"
  });

  if (!confirm.isConfirmed) {
    return;
  }

  showLoading();

  /* ===== CEK DATA EXIST ===== */
  const { data: existing, error: checkError } = await supabase
    .from("braking")
    .select("id")
    .eq("sesi", payload.sesi)
    .eq("brand", payload.brand)
    .eq("type", payload.type)
    .gte("created_at", start)
    .lte("created_at", end)
    .limit(1)
    .maybeSingle(); 

  if (checkError) {
    Swal.fire("Error", checkError.message, "error");
    hideLoading();
    return;
  }

  let result;

  if (existing) {
    result = await supabase
      .from("braking")
      .update(payload)
      .eq("id", existing.id);
  } else {
    result = await supabase
      .from("braking")
      .insert([payload]);
  }

  hideLoading();

  if (result.error) {
    Swal.fire("Error", result.error.message, "error");
  } else {
    Swal.fire("Berhasil", "Data berhasil disimpan", "success");
    loadData();
  }
});

function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}
