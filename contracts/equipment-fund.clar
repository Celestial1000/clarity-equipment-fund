;; Equipment Maintenance Fund Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-funds (err u101))
(define-constant err-not-participant (err u102))

;; Data Variables
(define-map participants principal uint)
(define-map equipment-items uint {name: (string-ascii 50), maintenance-cost: uint, next-maintenance: uint})
(define-data-var equipment-count uint u0)
(define-data-var total-fund uint u0)

;; Private Functions
(define-private (is-participant (user principal))
    (default-to false (some (is-some (map-get? participants user))))
)

;; Public Functions
(define-public (join-fund (initial-deposit uint))
    (begin
        (asserts! (> initial-deposit u0) (err u103))
        (map-set participants tx-sender initial-deposit)
        (var-set total-fund (+ (var-get total-fund) initial-deposit))
        (ok true)
    )
)

(define-public (contribute-funds (amount uint))
    (begin
        (asserts! (is-participant tx-sender) err-not-participant)
        (let ((current-contribution (default-to u0 (map-get? participants tx-sender))))
            (map-set participants tx-sender (+ current-contribution amount))
            (var-set total-fund (+ (var-get total-fund) amount))
            (ok true)
        )
    )
)

(define-public (register-equipment (name (string-ascii 50)) (maintenance-cost uint) (maintenance-interval uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (let ((equipment-id (var-get equipment-count)))
            (map-set equipment-items equipment-id 
                {
                    name: name,
                    maintenance-cost: maintenance-cost,
                    next-maintenance: (+ block-height maintenance-interval)
                }
            )
            (var-set equipment-count (+ equipment-id u1))
            (ok equipment-id)
        )
    )
)

(define-public (perform-maintenance (equipment-id uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (let (
            (equipment (unwrap! (map-get? equipment-items equipment-id) (err u104)))
            (maintenance-cost (get maintenance-cost equipment))
        )
            (asserts! (>= (var-get total-fund) maintenance-cost) err-insufficient-funds)
            (var-set total-fund (- (var-get total-fund) maintenance-cost))
            (ok true)
        )
    )
)

;; Read-only functions
(define-read-only (get-participant-contribution (user principal))
    (ok (default-to u0 (map-get? participants user)))
)

(define-read-only (get-total-fund)
    (ok (var-get total-fund))
)

(define-read-only (get-equipment-details (equipment-id uint))
    (map-get? equipment-items equipment-id)
)
