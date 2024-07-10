export const clearCacheData = () => {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name)
    })
  })
}

export const extractIds = (inputString) => {
  const idPattern = /\{([a-zA-Z0-9]{11})(?:\.([a-zA-Z0-9]{11}))?\}/g
  const matches = []
  let match
  while ((match = idPattern.exec(inputString)) !== null) {
    if (match[2]) {
      matches.push([match[1], match[2]])
    } else {
      matches.push([match[1]])
    }
  }
  return matches
}

export const updateFormulaNames = (pageData, data, formulaType) => {
  return pageData.map((item) => {
    if (item[formulaType] && isNaN(item[formulaType])) {
      const formulaIds = extractIds(item[formulaType])
      let updatedFormula = item[formulaType]
      formulaIds.forEach((id) => {
        let idName = ''
        const element = data.find((el) => el.id === id[0])
        idName = element?.displayName
        const regex = new RegExp(`{${id[0]}}`, 'g')
        updatedFormula = updatedFormula.replace(regex, idName)
        if (id.length === 2) {
          const categoryOption = data.find((el) => el.id === id[1])
          if (categoryOption) {
            idName += `(${categoryOption.displayName})`
            const regex = new RegExp(`{${id.join('.')}`, 'g')
            updatedFormula = updatedFormula.replace(regex, idName)
          }
        }
      })
      return {
        ...item,
        [`${formulaType}Name`]: updatedFormula
      }
    }
    return item
  })
}

export const generateDownloadingUrl = (dhis2Url, ou, dx, pe, co) => {
  let parameters = `api/analytics.json?dimension=ou:${ou}&dimension=pe:${pe}&dimension=dx:${dx}`
  let defaultFormat =
    '&displayProperty=NAME&ignoreLimit=TRUE&hierarchyMeta=true&hideEmptyRows=TRUE&showHierarchy=true&rows=ou;pe;dx'

  if (co.length !== 0) {
    parameters += `&dimenion=${co}`
    defaultFormat += ';co'
  }

  const url = `${dhis2Url}/${parameters}${defaultFormat}`
  return url
}

export const jsonToCsv = (data) => {
  const headers = data.headers
  const headerNames = headers.map((header) => header.column)
  const csvRows = []
  const objectsArray = []

  // Add the CSV header
  csvRows.push(headerNames.join(','))

  // Add the data rows
  for (const row of data.rows) {
    const rowObject = {}
    const values = headers.map((header) => {
      // Get the value for each header, handle null/undefined values
      const value = row[data.headers.indexOf(header)]
      rowObject[header.column] = value ?? '' // Assign value to the corresponding key in rowObject
      return JSON.stringify(value ?? '')
    })
    csvRows.push(values.join(','))
    objectsArray.push(rowObject) // Add the row object to the array
  }

  return { csvData: csvRows.join('\n'), headers: headerNames, dbObjects: objectsArray }
}

export const objectToCsv = (array) => {
  if (!array || !array.length) {
    console.error('No data to export')
    return
  }

  const headers = Object.keys(array[0])
  const csvRows = []

  // Add the headers row
  csvRows.push(headers.join(','))

  // Add each row of data
  for (const obj of array) {
    const values = headers.map((header) => {
      const escapedValue = ('' + obj[header]).replace(/"/g, '\\"')
      return `"${escapedValue}"`
    })
    csvRows.push(values.join(','))
  }

  // Create a Blob from the CSV string
  return csvRows.join('\n')
}
