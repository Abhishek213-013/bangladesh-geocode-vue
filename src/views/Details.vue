<template>
  <div class="container">
    <header>
      <h1>Details of {{ item.name || 'N/A' }}</h1>
      <p v-if="item.bn_name && item.name !== item.bn_name">Bengali Name: {{ item.bn_name }}</p>
    </header>

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <span
        v-for="(bc, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
        :class="{ active: index === breadcrumbs.length - 1 }"
        @click="goToBreadcrumb(index)"
      >
        {{ bc.name }}
        <span v-if="index < breadcrumbs.length - 1"> &gt; </span>
      </span>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading">Loading details...</div>
    <div v-else-if="!item.id" class="error">Item not found.</div>

    <!-- Details Card -->
    <div v-else class="card details-card">
      <div class="card-body">
        <p><strong>Bengali Name:</strong> {{ item.bn_name || 'N/A' }}</p>
        <p v-if="item.url">
          <strong>Website:</strong>
          <a :href="'https://' + item.url" target="_blank">{{ item.url }}</a>
        </p>
        <p v-if="item.lat && item.lon">
          <strong>Coordinates:</strong> {{ item.lat }}, {{ item.lon }}
        </p>
      </div>

      <!-- Map -->
      <div v-if="item.lat && item.lon" id="map" class="map"></div>

      <div class="card-footer">
        <button class="back-button" @click="$router.back()">← Back</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import L from 'leaflet'

const router = useRouter()
const route = useRoute()

// JSON links
const Links = [
  'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/divisions/divisions.json',
  'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/districts/districts.json',
  'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/upazilas/upazilas.json',
  'https://raw.githubusercontent.com/nuhil/bangladesh-geocode/refs/heads/master/unions/unions.json'
]

const item = ref({})
const loading = ref(false)
const breadcrumbs = ref([])

const level = Number(route.params.level)
const id = Number(route.params.id)

const divisions = ref([])
const districts = ref([])
const upazilas = ref([])
const unions = ref([])

async function fetchData() {
  loading.value = true
  try {
    const [divRes, disRes, upaRes, uniRes] = await Promise.all(Links.map(l => axios.get(l)))
    divisions.value = divRes.data.find(t => t.type === 'table').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, url: d.url, lat: d.lat, lon: d.lon
    }))
    districts.value = disRes.data.find(t => t.type === 'table').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, division_id: Number(d.division_id), url: d.url, lat: d.lat, lon: d.lon
    }))
    upazilas.value = upaRes.data.find(t => t.type === 'table').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, district_id: Number(d.district_id), url: d.url
    }))
    unions.value = uniRes.data.find(t => t.type === 'table').data.map(d => ({
      id: Number(d.id), name: d.name, bn_name: d.bn_name, upazilla_id: Number(d.upazilla_id), url: d.url
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function findItem() {
  let found
  if (level === 0) found = divisions.value.find(d => d.id === id)
  else if (level === 1) found = districts.value.find(d => d.id === id)
  else if (level === 2) found = upazilas.value.find(d => d.id === id)
  else if (level === 3) found = unions.value.find(d => d.id === id)

  if (found) {
    item.value = { ...found }
    buildBreadcrumb()
    initMap()
  }
}

function buildBreadcrumb() {
  breadcrumbs.value = []
  if (level >= 0 && item.value) {
    if (level === 0) breadcrumbs.value.push({ name: item.value.name, level: 0, id: item.value.id })
    if (level >= 1) {
      const div = divisions.value.find(d => d.id === item.value.division_id || (districts.value.find(x=>x.id===item.value.id)?.division_id))
      if (div) breadcrumbs.value.push({ name: div.name, level: 0, id: div.id })
      if (level === 1) breadcrumbs.value.push({ name: item.value.name, level: 1, id: item.value.id })
    }
    if (level >= 2) {
      const district = districts.value.find(d => d.id === item.value.district_id || (upazilas.value.find(x=>x.id===item.value.id)?.district_id))
      if (district) breadcrumbs.value.push({ name: district.name, level: 1, id: district.id })
      if (level === 2) breadcrumbs.value.push({ name: item.value.name, level: 2, id: item.value.id })
    }
    if (level === 3) {
      const upa = upazilas.value.find(u => u.id === item.value.upazilla_id)
      if (upa) breadcrumbs.value.push({ name: upa.name, level: 2, id: upa.id })
      breadcrumbs.value.push({ name: item.value.name, level: 3, id: item.value.id })
    }
  }
}

function goToBreadcrumb(index) {
  const bc = breadcrumbs.value[index]
  router.push(`/details/${bc.level}/${bc.id}`)
}

function initMap() {
  if (item.value.lat && item.value.lon) {
    nextTick(() => {
      const map = L.map('map').setView([Number(item.value.lat), Number(item.value.lon)], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      L.marker([Number(item.value.lat), Number(item.value.lon)])
        .addTo(map)
        .bindPopup(item.value.name)
        .openPopup()
    })
  }
}

onMounted(async () => {
  await fetchData()
  findItem()
})
</script>

<style scoped>
.container { max-width: 1200px; margin:0 auto; padding:20px; }
header { background:linear-gradient(135deg,#006a4e 0%,#008553 100%); color:white; padding:20px 0; text-align:center; border-radius:8px; margin-bottom:30px; box-shadow:0 4px 12px rgba(0,0,0,0.1);}
h1 { font-size:2.5rem; margin-bottom:10px;}
.details-card { background-color: #fff; border-radius: 8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.card-body { padding: 20px; }
.map { height: 400px; width: 100%; border-radius: 8px; margin-top: 20px; }
.card-footer { padding: 10px 20px; display:flex; justify-content:flex-start; }
.back-button { padding: 8px 16px; background-color: #6c757d; color:white; border:none; border-radius:4px; cursor:pointer; transition: background-color 0.3s; }
.back-button:hover { background-color: #5a6268; }
.breadcrumb { display:flex; justify-content:center; flex-wrap:wrap; margin-bottom:20px; padding:10px 15px; background-color:#e9ecef; border-radius:5px; }
.breadcrumb-item { margin:0 5px; color:#007bff; cursor:pointer; }
.breadcrumb-item:hover { text-decoration:underline; }
.breadcrumb-item.active { color:#6c757d; cursor:default; }
.loading,.error { text-align:center; font-size:1.2rem; padding:40px; }
.error { color: #dc3545; }
</style>
