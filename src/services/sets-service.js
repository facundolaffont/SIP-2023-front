/**
 * Une dos arreglos en base a la coincidencia de valores de una columna.
 * 
 * @param {Array.<Object>} array1
 * @param {Array.<Object>} array2
 * @param {*} column
 * @returns {Array.<Object>}
 */
export function mergeArrays(array1, array2, column) {
    
    const mergedArray = [];
    array1.forEach(item1 => {
      const matchingItem = array2.find(item2 => item1[column] === item2[column]);
      if (matchingItem) {
        mergedArray.push({ ...item1, ...matchingItem });
      }
    });

    return mergedArray;

  }