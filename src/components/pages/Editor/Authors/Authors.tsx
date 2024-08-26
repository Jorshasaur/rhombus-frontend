import * as React from 'react'
import styles from './Authors.module.css'
import { Author } from '../../../../interfaces/author'
interface Props {
    authors: Author[]
}

export default class Authors extends React.Component<Props> {
    render() {
        return (
            <div className={styles.authors} id="authors-column">
                {this.props.authors.length
                    ? this.props.authors.map((author, index) => {
                          const previousAuthor = this.props.authors[index - 1]

                          if (
                              !previousAuthor ||
                              previousAuthor.userId !== author.userId
                          ) {
                              return (
                                  <div
                                      key={index}
                                      style={{
                                          top: `${author.top}px`,
                                          height: author.lineHeight
                                      }}
                                      data-author={author.authorId}
                                      className={styles.authorLabel}>
                                      <span
                                          className={styles.fullName}
                                          style={{
                                              lineHeight: author.lineHeight
                                          }}>
                                          {author.name}
                                      </span>
                                      <span
                                          className={styles.abbreviatedName}
                                          style={{
                                              lineHeight: author.lineHeight
                                          }}>
                                          {this.getInitials(author.name)}
                                      </span>
                                  </div>
                              )
                          }
                          return
                      })
                    : null}
            </div>
        )
    }

    private getInitials(name?: string) {
        // If no value was passed-in, return nothing.
        if (!name) {
            return ''
        }
        var nameParts = name.replace(/^\s+|\s+$/g, '').split(/\s+/)
        var namePartsCount = nameParts.length
        // If we have multiple parts, get the first and last (skip any middle names / initials).
        if (namePartsCount > 1) {
            return (
                nameParts[0].slice(0, 1) +
                nameParts[namePartsCount - 1].slice(0, 1)
            )
        }
        // If we only have one part, just get the first initial.
        return nameParts[0].slice(0, 1)
    }
}
