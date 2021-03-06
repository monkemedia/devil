import api from '~/api'
import uploadcare from 'uploadcare-widget'

const state = () => ({
  loadedProduct: null,
  loadedVendorProduct: null,
  loadedVendorProducts: null
})

const mutations = {
  SET_PRODUCT (state, product) {
    state.loadedProduct = product
  },

  SET_VENDOR_PRODUCT (state, product) {
    state.loadedVendorProduct = product
  },

  REMOVE_VENDOR_PRODUCT (state, index) {
    state.loadedVendorProducts.splice(index, 1)
  },

  SET_VENDOR_PRODUCTS (state, product) {
    state.loadedVendorProducts = product
  }
}

const actions = {
  saveImageToStorage ({ commit, getters }, payload) {
    return new Promise((resolve, reject) => {
      const promises = []
      payload.forEach((image) => {
        const file = uploadcare.fileFrom('object', image)
        promises.push(file)
      })

      Promise.all(promises)
        .then((fileData) => {
          const newArray = []
          fileData.forEach((fd) => {
            const filename = fd.name
            const fullPath = fd.cdnUrl
            const uuid = fd.uuid
            newArray.push({
              url: fullPath,
              alt: filename.substr(0, filename.indexOf('.')),
              filename,
              uuid
            })
          })

          return resolve(newArray)
        })
        .catch((err) => {
          return reject(err)
        })
    })
  },

  removeImageFromStorage ({ commit, getters }, payload) {
    const publicKey = process.env.UPLOADCARE_PUBLIC_KEY
    const privateKey = process.env.UPLOADCARE_SECRET_KEY
    const vm = this

    return new Promise((resolve, reject) => {
      const promises = []

      function file (image) {
        const f = vm.$axios({
          url: 'https://api.uploadcare.com/files/' + image.uuid + '/storage/',
          method: 'delete',
          data: null,
          headers: {
            'Authorization': 'Uploadcare.Simple ' + publicKey + ':' + privateKey
          }
        })
        promises.push(f)
      }

      if (payload.images && payload.images.length) {
        payload.images.forEach((image) => {
          file(image)
        })
      } else {
        file(payload)
      }

      Promise.all(promises)
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  updateProduct ({ commit }, itemDetails) {
    return api.products.updateProduct(itemDetails)
      .then(res => {
        commit('SET_VENDOR_PRODUCT', res)
        return res
      })
      .catch(err => {
        throw err
      })
  },

  createProduct ({ commit }, itemDetails) {
    console.log('item details', itemDetails)
    return api.products.createProduct(itemDetails)
      .then(res => {
        commit('SET_VENDOR_PRODUCT', res.data.products)
        return res
      })
      .catch(err => {
        throw err
      })
  },

  deleteProduct ({ getters, commit }, data) {
    const productId = data.productId
    const productIndex = data.productIndex

    return api.products.deleteProduct(productId)
      .then(() => {
        commit('REMOVE_VENDOR_PRODUCT', productIndex)
        // const removeItem = _.pickBy(products, (key) => {
        //   return productId !== key._id
        // })

        // if (_.isEmpty(removeItem)) {
        //   commit('SET_VENDOR_PRODUCTS', [])
        // } else {
        //   commit('SET_VENDOR_PRODUCTS', removeItem)
        // }
      })
      .catch(err => {
        throw err
      })
  },

  product ({ commit }, productId) {
    return api.products.product(productId)
      .then(res => {
        commit('SET_PRODUCT', res.data.product)
        return res
      })
      .catch(err => {
        throw err.message
      })
  },

  vendorProducts ({ commit }) {
    return api.products.vendorProducts()
      .then(res => {
        commit('SET_VENDOR_PRODUCTS', res.data.products)
      })
      .catch(err => {
        throw err
      })
  },

  vendorProduct ({ commit }, productId) {
    return api.products.vendorProduct(productId)
      .then(res => {
        commit('SET_VENDOR_PRODUCT', res.data.product)
      })
      .catch(err => {
        throw err
      })
  }
}

const getters = {
  loadedVendorProduct (state) {
    return state.loadedVendorProduct
  },

  loadedVendorProducts (state) {
    return state.loadedVendorProducts
  },

  loadedProduct (state) {
    return state.loadedProduct
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
