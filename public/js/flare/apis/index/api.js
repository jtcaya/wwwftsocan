"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's IndexAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class IndexAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseURL Defaults to the string "/ext/index/X/tx" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/index/X/tx") {
        super(core, baseURL);
        /**
         * Get last accepted tx, vtx or block
         *
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetLastAcceptedResponse.
         */
        this.getLastAccepted = (encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                encoding
            };
            try {
                const response = yield this.callMethod("index.getLastAccepted", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get container by index
         *
         * @param index
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerByIndexResponse.
         */
        this.getContainerByIndex = (index = "0", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                index,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerByIndex", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get contrainer by ID
         *
         * @param id
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerByIDResponse.
         */
        this.getContainerByID = (id = "0", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                id,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerByID", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get container range
         *
         * @param startIndex
         * @param numToFetch
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerRangeResponse.
         */
        this.getContainerRange = (startIndex = 0, numToFetch = 100, encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                startIndex,
                numToFetch,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerRange", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get index by containerID
         *
         * @param id
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetIndexResponse.
         */
        this.getIndex = (id = "", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                id,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getIndex", params);
                return response.data.result.index;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Check if container is accepted
         *
         * @param id
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetIsAcceptedResponse.
         */
        this.isAccepted = (id = "", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                id,
                encoding
            };
            try {
                const response = yield this.callMethod("index.isAccepted", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.IndexAPI = IndexAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaW5kZXgvYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQWdCOUM7Ozs7OztHQU1HO0FBQ0gsTUFBYSxRQUFTLFNBQVEsaUJBQU87SUEyTG5DOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUFtQixFQUFFLFVBQWtCLGlCQUFpQjtRQUNsRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBak10Qjs7Ozs7OztXQU9HO1FBQ0gsb0JBQWUsR0FBRyxDQUNoQixXQUFtQixLQUFLLEVBQ3hCLFVBQWtCLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFDRCxFQUFFO1lBQ3BDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDeEIsTUFBTSxNQUFNLEdBQTBCO2dCQUNwQyxRQUFRO2FBQ1QsQ0FBQTtZQUVELElBQUk7Z0JBQ0YsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsdUJBQXVCLEVBQ3ZCLE1BQU0sQ0FDUCxDQUFBO2dCQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7YUFDNUI7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQ25CO1FBQ0gsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7V0FRRztRQUNILHdCQUFtQixHQUFHLENBQ3BCLFFBQWdCLEdBQUcsRUFDbkIsV0FBbUIsS0FBSyxFQUN4QixVQUFrQixJQUFJLENBQUMsVUFBVSxFQUFFLEVBQ0csRUFBRTtZQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3hCLE1BQU0sTUFBTSxHQUE4QjtnQkFDeEMsS0FBSztnQkFDTCxRQUFRO2FBQ1QsQ0FBQTtZQUVELElBQUk7Z0JBQ0YsTUFBTSxR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Q0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTthQUM1QjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDbkI7UUFDSCxDQUFDLENBQUEsQ0FBQTtJQVVELENBQUM7Q0FDRjtBQXBNRCw0QkFvTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktSW5kZXhcbiAqL1xuaW1wb3J0IEF2YWxhbmNoZUNvcmUgZnJvbSBcIi4uLy4uL2F2YWxhbmNoZVwiXG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9qcnBjYXBpXCJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxuaW1wb3J0IHtcbiAgR2V0TGFzdEFjY2VwdGVkUGFyYW1zLFxuICBHZXRMYXN0QWNjZXB0ZWRSZXNwb25zZSxcbiAgR2V0Q29udGFpbmVyQnlJbmRleFBhcmFtcyxcbiAgR2V0Q29udGFpbmVyQnlJbmRleFJlc3BvbnNlLFxuICBHZXRDb250YWluZXJCeUlEUGFyYW1zLFxuICBHZXRDb250YWluZXJCeUlEUmVzcG9uc2UsXG4gIEdldENvbnRhaW5lclJhbmdlUGFyYW1zLFxuICBHZXRDb250YWluZXJSYW5nZVJlc3BvbnNlLFxuICBHZXRJbmRleFBhcmFtcyxcbiAgR2V0SXNBY2NlcHRlZFBhcmFtcyxcbiAgSXNBY2NlcHRlZFJlc3BvbnNlXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIEluZGV4QVBJLlxuICpcbiAqIEBjYXRlZ29yeSBSUENBUElzXG4gKlxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0F2YWxhbmNoZS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF2YWxhbmNoZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEluZGV4QVBJIGV4dGVuZHMgSlJQQ0FQSSB7XG4gIC8qKlxuICAgKiBHZXQgbGFzdCBhY2NlcHRlZCB0eCwgdnR4IG9yIGJsb2NrXG4gICAqXG4gICAqIEBwYXJhbSBlbmNvZGluZ1xuICAgKiBAcGFyYW0gYmFzZVVSTFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBHZXRMYXN0QWNjZXB0ZWRSZXNwb25zZS5cbiAgICovXG4gIGdldExhc3RBY2NlcHRlZCA9IGFzeW5jIChcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIixcbiAgICBiYXNlVVJMOiBzdHJpbmcgPSB0aGlzLmdldEJhc2VVUkwoKVxuICApOiBQcm9taXNlPEdldExhc3RBY2NlcHRlZFJlc3BvbnNlPiA9PiB7XG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gICAgY29uc3QgcGFyYW1zOiBHZXRMYXN0QWNjZXB0ZWRQYXJhbXMgPSB7XG4gICAgICBlbmNvZGluZ1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgICAgXCJpbmRleC5nZXRMYXN0QWNjZXB0ZWRcIixcbiAgICAgICAgcGFyYW1zXG4gICAgICApXG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjb250YWluZXIgYnkgaW5kZXhcbiAgICpcbiAgICogQHBhcmFtIGluZGV4XG4gICAqIEBwYXJhbSBlbmNvZGluZ1xuICAgKiBAcGFyYW0gYmFzZVVSTFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBHZXRDb250YWluZXJCeUluZGV4UmVzcG9uc2UuXG4gICAqL1xuICBnZXRDb250YWluZXJCeUluZGV4ID0gYXN5bmMgKFxuICAgIGluZGV4OiBzdHJpbmcgPSBcIjBcIixcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIixcbiAgICBiYXNlVVJMOiBzdHJpbmcgPSB0aGlzLmdldEJhc2VVUkwoKVxuICApOiBQcm9taXNlPEdldENvbnRhaW5lckJ5SW5kZXhSZXNwb25zZT4gPT4ge1xuICAgIHRoaXMuc2V0QmFzZVVSTChiYXNlVVJMKVxuICAgIGNvbnN0IHBhcmFtczogR2V0Q29udGFpbmVyQnlJbmRleFBhcmFtcyA9IHtcbiAgICAgIGluZGV4LFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICAgIFwiaW5kZXguZ2V0Q29udGFpbmVyQnlJbmRleFwiLFxuICAgICAgICBwYXJhbXNcbiAgICAgIClcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbnRyYWluZXIgYnkgSURcbiAgICpcbiAgICogQHBhcmFtIGlkXG4gICAqIEBwYXJhbSBlbmNvZGluZ1xuICAgKiBAcGFyYW0gYmFzZVVSTFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBHZXRDb250YWluZXJCeUlEUmVzcG9uc2UuXG4gICAqL1xuICBnZXRDb250YWluZXJCeUlEID0gYXN5bmMgKFxuICAgIGlkOiBzdHJpbmcgPSBcIjBcIixcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIixcbiAgICBiYXNlVVJMOiBzdHJpbmcgPSB0aGlzLmdldEJhc2VVUkwoKVxuICApOiBQcm9taXNlPEdldENvbnRhaW5lckJ5SURSZXNwb25zZT4gPT4ge1xuICAgIHRoaXMuc2V0QmFzZVVSTChiYXNlVVJMKVxuICAgIGNvbnN0IHBhcmFtczogR2V0Q29udGFpbmVyQnlJRFBhcmFtcyA9IHtcbiAgICAgIGlkLFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICAgIFwiaW5kZXguZ2V0Q29udGFpbmVyQnlJRFwiLFxuICAgICAgICBwYXJhbXNcbiAgICAgIClcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbnRhaW5lciByYW5nZVxuICAgKlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleFxuICAgKiBAcGFyYW0gbnVtVG9GZXRjaFxuICAgKiBAcGFyYW0gZW5jb2RpbmdcbiAgICogQHBhcmFtIGJhc2VVUkxcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgR2V0Q29udGFpbmVyUmFuZ2VSZXNwb25zZS5cbiAgICovXG4gIGdldENvbnRhaW5lclJhbmdlID0gYXN5bmMgKFxuICAgIHN0YXJ0SW5kZXg6IG51bWJlciA9IDAsXG4gICAgbnVtVG9GZXRjaDogbnVtYmVyID0gMTAwLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG4gICk6IFByb21pc2U8R2V0Q29udGFpbmVyUmFuZ2VSZXNwb25zZVtdPiA9PiB7XG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gICAgY29uc3QgcGFyYW1zOiBHZXRDb250YWluZXJSYW5nZVBhcmFtcyA9IHtcbiAgICAgIHN0YXJ0SW5kZXgsXG4gICAgICBudW1Ub0ZldGNoLFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICAgIFwiaW5kZXguZ2V0Q29udGFpbmVyUmFuZ2VcIixcbiAgICAgICAgcGFyYW1zXG4gICAgICApXG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbmRleCBieSBjb250YWluZXJJRFxuICAgKlxuICAgKiBAcGFyYW0gaWRcbiAgICogQHBhcmFtIGVuY29kaW5nXG4gICAqIEBwYXJhbSBiYXNlVVJMXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldEluZGV4UmVzcG9uc2UuXG4gICAqL1xuICBnZXRJbmRleCA9IGFzeW5jIChcbiAgICBpZDogc3RyaW5nID0gXCJcIixcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIixcbiAgICBiYXNlVVJMOiBzdHJpbmcgPSB0aGlzLmdldEJhc2VVUkwoKVxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIHRoaXMuc2V0QmFzZVVSTChiYXNlVVJMKVxuICAgIGNvbnN0IHBhcmFtczogR2V0SW5kZXhQYXJhbXMgPSB7XG4gICAgICBpZCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgICBcImluZGV4LmdldEluZGV4XCIsXG4gICAgICAgIHBhcmFtc1xuICAgICAgKVxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmluZGV4XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjb250YWluZXIgaXMgYWNjZXB0ZWRcbiAgICpcbiAgICogQHBhcmFtIGlkXG4gICAqIEBwYXJhbSBlbmNvZGluZ1xuICAgKiBAcGFyYW0gYmFzZVVSTFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBHZXRJc0FjY2VwdGVkUmVzcG9uc2UuXG4gICAqL1xuICBpc0FjY2VwdGVkID0gYXN5bmMgKFxuICAgIGlkOiBzdHJpbmcgPSBcIlwiLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG4gICk6IFByb21pc2U8SXNBY2NlcHRlZFJlc3BvbnNlPiA9PiB7XG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gICAgY29uc3QgcGFyYW1zOiBHZXRJc0FjY2VwdGVkUGFyYW1zID0ge1xuICAgICAgaWQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgICAgXCJpbmRleC5pc0FjY2VwdGVkXCIsXG4gICAgICAgIHBhcmFtc1xuICAgICAgKVxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tBdmFsYW5jaGUuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXZhbGFuY2hlIGNsYXNzXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L2luZGV4L1gvdHhcIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNlVVJMXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOiBBdmFsYW5jaGVDb3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvaW5kZXgvWC90eFwiKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcbiAgfVxufVxuIl19