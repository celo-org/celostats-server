// @ts-expect-error not a module
import Primus from "primus"

export function deleteSpark(
  spark: Primus.spark
): void {
  setTimeout((): void => {

    for (const key of Object.keys(spark)) {
      delete spark[key]
    }

    for (const key of Object.getOwnPropertyNames(spark)) {
      delete spark[key]
    }

    for (const key in spark) {
      delete (spark[key])
    }

  }, 10);
}
