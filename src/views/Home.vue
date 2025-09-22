<template>
  <div class="container">
    <header>
      <h1>Bangladesh Administrative Areas</h1>
      <p>Explore divisions, districts, upazilas, and unions of Bangladesh</p>
    </header>

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <span
        v-for="(item, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
        :class="{ active: index === breadcrumbs.length - 1 }"
        @click="goToBreadcrumb(index)"
      >
        {{ item.name }}
        <span v-if="index < breadcrumbs.length - 1"> &gt; </span>
      </span>
    </div>

    <!-- Back button -->
    <button v-if="currentLevel > 0" @click="goBack" class="back-button">
      &larr; Back
    </button>

    <!-- Page title -->
    <h2 class="page-title">{{ pageTitle }}</h2>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading">Loading data, please wait...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Cards -->
    <div v-else class="card-container">
      <div
        v-for="item in currentData"
        :key="item.id"
        class="card"
      >
        <div class="card-header">{{ item.name || item.bn_name || 'N/A' }}</div>
        <div class="card-body">
          <p v-if="item.bn_name && item.name !== item.bn_name">
            Bengali: {{ item.bn_name }}
          </p>
          <p v-if="item.url">
            Website:
            <a :href="'https://' + item.url" target="_blank">{{ item.url }}</a>
          </p>
        </div>
        <div class="card-footer">
          <button class="btn proceed-btn" @click.stop="proceed(item)">
            {{ getProceedText() }}
          </button>
          <button class="btn view-btn" @click.stop="viewDetails(item)">
            View Details
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// Button labels
function getProceedText() {
  switch (currentLevel.value) {
    case 0: return 'Proceed to see Districts'
    case 1: return 'Proceed to see Upazilas'
    case 2: return 'Proceed to see Unions'
    default: return 'Proceed'
  }
}

// Navigate to details page
function viewDetails(item) {
  router.push({
    path: `/details/${currentLevel.value}/${item.id}`
  })
}


// Proceed button just updates level (does not go to details route)
function proceed(item) {
  if (currentLevel.value === 0) selectedDivision.value = item
  else if (currentLevel.value === 1) selectedDistrict.value = item
  else if (currentLevel.value === 2) selectedUpazila.value = item

  currentLevel.value++
  breadcrumbs.value.push({ name: item.name, level: currentLevel.value - 1, id: item.id })
}

// JSON URLs
const Links = [
  { URL: 'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/divisions/divisions.json' },
  { URL: 'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/districts/districts.json' },
  { URL: 'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/upazilas/upazilas.json' },
  { URL: 'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/unions/unions.json' }
]

// Data refs
const divisions = ref([])
const districts = ref([])
const upazilas = ref([])
const unions = ref([])

const loading = ref(false)
const error = ref('')
const currentLevel = ref(0)
const selectedDivision = ref(null)
const selectedDistrict = ref(null)
const selectedUpazila = ref(null)
const breadcrumbs = ref([{ name: 'Divisions', level: 0 }])

// Computed data for current level
const currentData = computed(() => {
  switch (currentLevel.value) {
    case 0: return divisions.value
    case 1: return districts.value.filter(d => selectedDivision.value && d.division_id === selectedDivision.value.id)
    case 2: return upazilas.value.filter(u => selectedDistrict.value && u.district_id === selectedDistrict.value.id)
    case 3: return unions.value.filter(u => selectedUpazila.value && u.upazilla_id === selectedUpazila.value.id)
    default: return []
  }
})

// Page title
const pageTitle = computed(() => [
  'Divisions of Bangladesh',
  `Districts of ${selectedDivision.value ? selectedDivision.value.name : ''} Division`,
  `Upazilas of ${selectedDistrict.value ? selectedDistrict.value.name : ''} District`,
  `Unions of ${selectedUpazila.value ? selectedUpazila.value.name : ''} Upazila`
][currentLevel.value])

// Fetch JSON
async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const [divRes, disRes, upaRes, uniRes] = await Promise.all(Links.map(l => axios.get(l.URL)))
    divisions.value = divRes.data.find(t => t.type === 'table' && t.name === 'divisions').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, url: d.url
    }))
    districts.value = disRes.data.find(t => t.type === 'table' && t.name === 'districts').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, division_id: Number(d.division_id), lat: d.lat, lon: d.lon, url: d.url
    }))
    upazilas.value = upaRes.data.find(t => t.type === 'table' && t.name === 'upazilas').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, district_id: Number(d.district_id), url: d.url
    }))
    unions.value = uniRes.data.find(t => t.type === 'table' && t.name === 'unions').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, upazilla_id: Number(d.upazilla_id), url: d.url
    }))
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load data. Check your internet connection.'
  } finally {
    loading.value = false
  }
}

// Navigation
function goBack() {
  if (currentLevel.value === 0) return
  currentLevel.value--
  breadcrumbs.value.pop()
  if (currentLevel.value === 0) selectedDivision.value = null, selectedDistrict.value = null, selectedUpazila.value = null
  else if (currentLevel.value === 1) selectedDistrict.value = null, selectedUpazila.value = null
  else if (currentLevel.value === 2) selectedUpazila.value = null
}

function goToBreadcrumb(index) {
  if (index === breadcrumbs.value.length - 1) return
  const target = breadcrumbs.value[index]
  currentLevel.value = target.level
  if (target.level === 0) selectedDivision.value = null, selectedDistrict.value = null, selectedUpazila.value = null
  else if (target.level === 1) selectedDivision.value = divisions.value.find(d => d.id === target.id), selectedDistrict.value = null, selectedUpazila.value = null
  else if (target.level === 2) selectedDistrict.value = districts.value.find(d => d.id === target.id), selectedDivision.value = divisions.value.find(d => d.id === selectedDistrict.value.division_id), selectedUpazila.value = null
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
}

onMounted(fetchData)
</script>

<style scoped>
* { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
.container { max-width:1200px; margin:0 auto; padding:20px;}
header { background:linear-gradient(135deg,#006a4e 0%,#008553 100%); color:white; padding:20px 0; text-align:center; border-radius:8px; margin-bottom:30px; box-shadow:0 4px 12px rgba(0,0,0,0.1);}
h1 { font-size:2.5rem; margin-bottom:10px;}
.breadcrumb { display:flex; justify-content:center; flex-wrap:wrap; margin-bottom:20px; padding:10px 15px; background-color:#e9ecef; border-radius:5px;}
.breadcrumb-item { margin:0 5px; cursor:pointer; color:#007bff;}
.breadcrumb-item:hover { text-decoration:underline;}
.breadcrumb-item.active { color:#6c757d; cursor:default;}
.card-container { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; margin-top:20px;}
.card { background-color:white; border-radius:8px; overflow:hidden; transition:transform 0.3s ease,box-shadow 0.3s ease; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer;}
.card:hover { transform:translateY(-5px); box-shadow:0 5px 15px rgba(0,0,0,0.2);}
.card-header { background-color:#f8f9fa; padding:15px; border-bottom:1px solid #e9ecef; font-weight:bold;}
.card-body { padding:15px;}
.card-footer { background-color:#f8f9fa; padding:10px 15px; text-align:right; font-size:0.9rem; color:#6c757d;}
.loading,.error { text-align:center; padding:40px; font-size:1.2rem;}
.error { color:#dc3545;}
.back-button { background-color:#6c757d; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; margin-bottom:20px; transition:background-color 0.3s;}
.back-button:hover { background-color:#5a6268;}
.page-title { margin-bottom:20px; color:#006a4e; border-bottom:2px solid #006a4e; padding-bottom:10px;}
.footer { text-align:center; margin-top:40px; padding:20px; color:#6c757d; font-size:0.9rem;}
@media(max-width:768px){.card-container{grid-template-columns:1fr;} h1{font-size:2rem;}}
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin: 0 5px;
  transition: background-color 0.3s ease;
}

.proceed-btn {
  background-color: #28a745;
  color: white;
}

.proceed-btn:hover {
  background-color: #218838;
}

.view-btn {
  background-color: #007bff;
  color: white;
}

.view-btn:hover {
  background-color: #0069d9;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 10px 15px;
}

</style>
